const {
    AudioPlayerStatus,
    createAudioPlayer,
    entersState,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionStatus,
} = require('@discordjs/voice');
const { Track } = require('./Track');
const { wait, createCancellableSignal } = require('../utils/CancellablePromise');
const { stdLog } = require('../utils/Utility');
/**
 * A MusicSubscription exists for each active VoiceConnection. Each subscription has its own audio player and queue,
 * and it also attaches logic to the audio player and voice connection for error handling and reconnection logic.
 */

class MusicSubscription {
    /**
     * @param {VoiceConnection} voiceConnection
     */
    constructor(voiceConnection) {
        this.current = 0;
        this.leave = false;
        this.destroyed = false;
        this.queueLock = false;
        this.readyLock = false;
        this.timeout = createCancellableSignal();
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.queue = [];
        this.loop = { queue: false, song: false };
        this.announce = true;

        this.voiceConnection.on('stateChange', async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (
                    newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
                    newState.closeCode === 4014
                ) {
                    /*
						If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
						but there is a chance the connection will recover itself if the reason of the disconnect was due to
						switching voice channels. This is also the same code for the bot being kicked from the voice channel,
						so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
						the voice connection.
					*/
                    try {
                        await entersState(
                            this.voiceConnection,
                            VoiceConnectionStatus.Connecting,
                            5_000
                        );
                        // Probably moved voice channel
                    } catch {
                        this.voiceConnection.destroy();
                        // Probably removed from voice channel
                    }
                } else if (this.voiceConnection.rejoinAttempts < 5) {
                    /*
						The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
					*/
                    await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
                    this.voiceConnection.rejoin();
                } else {
                    /*
						The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
					*/
                    this.voiceConnection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                /*
					Once destroyed, stop the subscription
				*/
                this.destroyed = true;
                this.stop();
            } else if (
                !this.readyLock &&
                (newState.status === VoiceConnectionStatus.Connecting ||
                    newState.status === VoiceConnectionStatus.Signalling)
            ) {
                /*
					In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
					before destroying the voice connection. This stops the voice connection permanently existing in one of these
					states.
				*/
                this.readyLock = true;
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
                } catch {
                    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed)
                        this.voiceConnection.destroy();
                } finally {
                    this.readyLock = false;
                }
            }
        });

        // Configure audio player
        this.audioPlayer.on('stateChange', async (oldState, newState) => {
            if (
                oldState.status === AudioPlayerStatus.Playing &&
                newState.status === AudioPlayerStatus.Idle
            ) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                if (this.loop.queue) {
                    this.current = !this.queue.at(this.current + 1) ? 0 : this.current + 1;
                } else if (!this.loop.song) {
                    this.current++;
                }
                if (!this.queue.at(this.current) && !this.destroyed) {
                    oldState.resource.metadata.onFinish();
                    this.leave = true;
                    await wait(this.timeout.signal, 5 * 60_000).catch(() => void 0);
                    if (this.leave) {
                        try {
                            this.voiceConnection.destroy();
                        } catch (err) {
                            stdLog(1, {
                                extra: '[MusicSubscription] Voice connection already destroyed',
                            });
                        }
                        this.destroyed = true;
                    }
                }
                void this.processQueue();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                if (this.leave) {
                    this.timeout.cancelTimeout();
                    this.timeout = createCancellableSignal();
                }
                this.leave = false;
                if (oldState.status !== AudioPlayerStatus.Paused) {
                    newState.resource.metadata.onStart();
                }
            } else if (
                oldState.status === AudioPlayerStatus.Playing &&
                newState.status === AudioPlayerStatus.Paused
            ) {
                this.leave = true;
                await wait(this.timeout.signal, 5 * 60_000).catch(() => void 0);
                if (this.leave) {
                    try {
                        this.voiceConnection.destroy();
                    } catch (err) {
                        stdLog(1, {
                            extra: '[MusicSubscription] Voice connection already destroyed',
                        });
                    }
                    this.destroyed = true;
                }
            }
        });

        this.audioPlayer.on('error', (error) => error.resource.metadata.onError(error));

        voiceConnection.subscribe(this.audioPlayer);
    }

    shuffle() {
        this.queueLock = true;
        const size = this.queue.length;
        let { index, track } = this.getCurrentTrack();
        for (let i = 0; i < size; i++) {
            const a = Math.floor(Math.random() * size);
            const b = Math.floor(Math.random() * size);
            if (a === index) index = b;
            else if (b === index) index = a;
            [this.queue[a], this.queue[b]] = [this.queue[b], this.queue[a]];
        }
        if (track) {
            [this.queue[0], this.queue[index]] = [this.queue[index], this.queue[0]];
            this.current = 0;
        }
        this.queueLock = false;
    }

    /**
     *
     * @param {Number} trackNumber Track Number in queue
     */
    removeTrack(trackNumber) {
        this.queue = this.queue.filter((_, i) => i !== trackNumber - 1);

        if (
            trackNumber - 1 === this.current &&
            this.audioPlayer.state.status === AudioPlayerStatus.Playing
        ) {
            this.current--;
            this.skip();
        } else if (
            trackNumber - 1 === this.current &&
            this.audioPlayer.state.status === AudioPlayerStatus.Paused
        ) {
            this.skip();
            this.current--;
        } else if (trackNumber - 1 <= this.current) this.current--;
    }

    getCurrentTrack() {
        return { index: this.current, track: this.queue[this.current] };
    }

    pause() {
        if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
            this.audioPlayer.pause();
            return true;
        }
        return false;
    }

    resume() {
        if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            this.audioPlayer.unpause();
            return true;
        }
        return false;
    }

    skip() {
        if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            if (this.loop.song) this.current++;
            this.audioPlayer.stop();
            this.audioPlayer.unpause();
        } else if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
            this.current++;
            this.processQueue();
        } else {
            if (this.loop.song) this.current++;
            this.audioPlayer.stop();
        }
    }

    prev() {
        if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            if (this.loop.song) this.current--;
            else this.current -= 2;
            this.audioPlayer.stop();
            this.audioPlayer.unpause();
        } else if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
            this.current -= 1;
            this.processQueue();
        } else {
            if (this.loop.song) this.current--;
            else this.current -= 2;
            this.audioPlayer.stop();
        }
    }

    /**
     *
     * @param {Number} index Track index
     */
    changeTrack(index) {
        if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            this.current = index - 2;
            this.audioPlayer.stop();
            this.audioPlayer.unpause();
        } else if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
            this.current = index - 1;
            this.processQueue();
        } else {
            if (this.loop.song) this.current = index - 1;
            else this.current = index - 2;
            this.audioPlayer.stop();
        }
    }

    /**
     * Adds a new Track to the queue.
     *
     * @param {Track[]} trackList The track to add to the queue
     */
    enqueue(trackList) {
        trackList.forEach((track) => {
            this.queue.push(track);
        });
        void this.processQueue();
    }

    /**
     * Stops audio playback and empties the queue
     */
    stop() {
        this.current = 0;
        this.queueLock = true;
        this.queue = [];
        this.announce = true;
        this.audioPlayer.stop(true);
    }

    /**
     * Attempts to play a Track from the queue
     */
    async processQueue() {
        // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
        if (
            this.queueLock ||
            this.audioPlayer.state.status !== AudioPlayerStatus.Idle ||
            !this.queue.at(this.current)
        ) {
            return;
        }

        // Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
        const trackToPlay = this.queue.at(this.current);

        // Lock the queue to guarantee safe access
        this.queueLock = true;
        try {
            // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
            const resource = await trackToPlay.createAudioResource();
            this.audioPlayer.play(resource);
            this.queueLock = false;
        } catch (error) {
            // If an error occurred, try the next item of the queue instead
            trackToPlay.onError(error);
            this.queueLock = false;
            return this.processQueue();
        }
    }
}

module.exports = { MusicSubscription };

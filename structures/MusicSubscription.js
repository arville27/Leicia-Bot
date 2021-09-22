const {
    AudioPlayerStatus,
    createAudioPlayer,
    entersState,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionStatus,
} = require('@discordjs/voice');
const { Track } = require('./Track');
const { promisify } = require('util');
const wait = promisify(setTimeout);

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
        this.size = 1;
        this.leave = false;
        this.destroyed = false;
        this.queueLock = false;
        this.readyLock = false;
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.queue = [];

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
                newState.status === AudioPlayerStatus.Idle &&
                oldState.status !== AudioPlayerStatus.Idle
            ) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                this.current++;
                if (!this.queue.at(this.current)) {
                    oldState.resource.metadata.onFinish();
                    this.leave = true;
                    this.timeout = await wait(5 * 60_000);
                    if (this.leave) {
                        try {
                            this.voiceConnection.destroy();
                        } catch (err) {
                            console.log('Voice connection already destroyed');
                        }
                        this.destroyed = true;
                    }
                }
                void this.processQueue();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                this.leave = false;
                newState.resource.metadata.onStart();
            }
        });

        this.audioPlayer.on('error', (error) => error.resource.metadata.onError(error));

        voiceConnection.subscribe(this.audioPlayer);
    }

    skip() {
        this.audioPlayer.stop();
    }

    prev() {
        if (this.audioPlayer.state.status == AudioPlayerStatus.Idle) {
            this.current -= 1;
            this.processQueue();
        } else {
            this.current -= 2;
            this.audioPlayer.stop();
        }
    }

    changeTrack(index) {
        if (this.audioPlayer.state.status == AudioPlayerStatus.Idle) {
            this.current = index - 1;
            this.processQueue();
        } else {
            this.current = index - 2;
            this.audioPlayer.stop();
        }
    }
    /**
     * Adds a new Track to the queue.
     *
     * @param {Track} track The track to add to the queue
     */
    enqueue(track) {
        track.position = this.size++;
        this.queue.push(track);
        void this.processQueue();
    }

    /**
     * Adds a new Track to the queue.
     *
     * @param {Track[]} trackList The track to add to the queue
     */
    enqueueList(trackList) {
        trackList.forEach((track) => {
            track.position = this.size++;
            this.queue.push(track);
        });
        void this.processQueue();
    }

    /**
     * Stops audio playback and empties the queue
     */
    stop() {
        this.current = 0;
        this.size = 1;
        this.queueLock = true;
        this.queue = [];
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
            // console.log(trackToPlay);
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

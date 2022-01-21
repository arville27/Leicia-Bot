const { createAudioResource, StreamType, demuxProbe } = require('@discordjs/voice');
const { TrackMetadata } = require('./TrackMetadata');
const ytcore = require('ytdl-core');
const youtubeDlExec = require('youtube-dl-exec').exec;
/**
 * A Track represents information about a YouTube video (in this context) that can be added to a queue.
 * It contains the title and URL of the video, as well as functions onStart, onFinish, onError, that act
 * as callbacks that are triggered at certain points during the track's lifecycle.
 *
 * Rather than creating an AudioResource for each video immediately and then keeping those in a queue,
 * we use tracks as they don't pre-emptively load the videos. Instead, once a Track is taken from the
 * queue, it is converted into an AudioResource just in time for playback.
 */
class Track {
    /**
     * @typedef {{onStart: () => void, onFinish: () => void, onError: (error: Error) => void}} TrackInfoMethods
     * @param {TrackMetadata} trackMetadata
     * @param {TrackInfoMethods} trackInfoMethods
     */
    constructor(trackMetadata, trackInfoMethods) {
        this.trackMetadata = trackMetadata;
        this.url = trackMetadata.url;
        this.thumbnail = trackMetadata.thumbnail;
        this.title = trackMetadata.title;
        this.length = trackMetadata.length;
        this.onStart = trackInfoMethods.onStart;
        this.onFinish = trackInfoMethods.onFinish;
        this.onError = trackInfoMethods.onError;
    }

    /**
     * Creates an AudioResource from this Track.
     */
    createAudioResource() {
        if (this.trackMetadata.isLive) {
            return new Promise((resolve, reject) => {
                try {
                    const stream = ytcore(this.url, {
                        filter: (format) => format.isHLS,
                        quality: 'highestaudio',
                        // highWaterMark: 1 << 23,
                        liveBuffer: 1000,
                        // dlChunkSize: 1 << 12,
                    });

                    resolve(
                        createAudioResource(stream, {
                            metadata: this,
                            inputType: StreamType.Arbitrary,
                        })
                    );
                } catch (error) {
                    reject(error);
                }
            });
        }
        return new Promise((resolve, reject) => {
            const process = youtubeDlExec(
                this.url,
                {
                    o: '-',
                    q: '',
                    r: '1M',
                    'fragment-retries': '100',
                    'skip-unavailable-fragments': '',
                    f: 'bestaudio[ext=webm+aco/dec=opus+asr=48000]/bestaudio',
                },
                { stdio: ['ignore', 'pipe', 'ignore'] }
            );
            if (!process.stdout) {
                reject(new Error('No stdout'));
                return;
            }
            const stream = process.stdout;
            process
                .once('spawn', () => {
                    demuxProbe(stream).then((probe) =>
                        resolve(
                            createAudioResource(probe.stream, {
                                metadata: this,
                                inputType: probe.type,
                            })
                        )
                    );
                })
                .catch((error) => {
                    if (!process.killed) process.kill();
                    stream.resume();
                    reject(error);
                });
        });
    }

    /**
     *
     * @param methods TrackInfo callbacks
     */
    setTrackInfoMethods(methodsObject) {
        this.onStart = methodsObject.onStart;
        this.onFinish = methodsObject.onFinish;
        this.onError = methodsObject.onError;
    }

    getTrackMetadata() {
        return this.trackMetadata;
    }
}

module.exports = { Track };

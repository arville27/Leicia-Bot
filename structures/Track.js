const { createAudioResource, demuxProbe } = require('@discordjs/voice');
const { raw } = require('youtube-dl-exec');
const { TrackMetadata } = require('./TrackMetadata');
const { ytCookies } = require('../config.json');
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
        this.url = trackMetadata.url;
        this.thumbnail = trackMetadata.thumbnail;
        this.title = trackMetadata.title;
        this.duration = trackMetadata.getTrackDuration();
        this.onStart = trackInfoMethods.onStart;
        this.onFinish = trackInfoMethods.onFinish;
        this.onError = trackInfoMethods.onError;
    }

    /**
     * Creates an AudioResource from this Track.
     */
    createAudioResource() {
        const flags = {
            o: '-',
            q: '',
            f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
        };

        if (ytCookies) {
            flags.cookies = ytCookies;
        }

        return new Promise((resolve, reject) => {
            const process = raw(this.url, flags, { stdio: ['ignore', 'pipe', 'ignore'] });
            if (!process.stdout) {
                reject(new Error('No stdout'));
                return;
            }
            const stream = process.stdout;
            const onError = (error) => {
                if (!process.killed) process.kill();
                stream.resume();
                reject(error);
            };
            process
                .once('spawn', () => {
                    demuxProbe(stream)
                        .then((probe) =>
                            resolve(
                                createAudioResource(probe.stream, {
                                    metadata: this,
                                    inputType: probe.type,
                                })
                            )
                        )
                        .catch(onError);
                })
                .catch(onError);
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
}

module.exports = { Track };

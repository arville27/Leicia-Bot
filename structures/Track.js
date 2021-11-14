const { createAudioResource, StreamType } = require('@discordjs/voice');
const { TrackMetadata } = require('./TrackMetadata');
const ytdl = require('ytdl-core');
// const { ytCookies } = require('../config.json');
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
        // if (ytCookies) {
        //     flags.cookies = ytCookies;
        // }
        return new Promise((resolve, reject) => {
            try {
                const stream = ytdl(this.url, {
                    // filter: (format) => format.container === 'mp4',
                    filter: this.trackMetadata.isLive
                        ? (format) => format.isHLS === true
                        : (format) => format.container === 'webm' && format.codecs === 'opus',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 23,
                    liveBuffer: 2500,
                    // dlChunkSize: 1 << 12,
                });

                const type = this.trackMetadata.isLive ? StreamType.Arbitrary : StreamType.WebmOpus;

                resolve(
                    createAudioResource(stream, {
                        metadata: this,
                        inputType: type,
                    })
                );
            } catch (error) {
                console.log(error);
                reject(error);
            }
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

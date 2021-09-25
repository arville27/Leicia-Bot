const { getInfo } = require('ytdl-core');
const { createAudioResource, demuxProbe } = require('@discordjs/voice');
const { raw } = require('youtube-dl-exec');
const ytpl = require('ytpl');
const { MessageEmbed, CommandInteraction } = require('discord.js');
const { parsePlaylist, parseAlbum } = require('../structures/SpotifyTrack');

const noop = () => {};

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
     * @typedef {{url: string, title: string, thumbnail: string, length: int, onStart: () => void, onFinish: () => void, onError: (error: Error) => void}} TrackData
     * @param {TrackData} param
     */
    constructor({ url, title, thumbnail, length, onStart, onFinish, onError }) {
        this.url = url;
        this.thumbnail = thumbnail;
        this.title = title;
        this.duration = {
            hour: `${Math.floor(length / 3600)}`.padStart(2, 0),
            minute: `${Math.floor((length / 60) % 60)}`.padStart(2, 0),
            second: `${length % 60}`.padStart(2, 0),
        };
        this.onStart = onStart;
        this.onFinish = onFinish;
        this.onError = onError;
    }

    getTrackDuration() {
        if (parseInt(this.duration.hour) > 0)
            return `${this.duration.hour}:${this.duration.minute}:${this.duration.second}`;
        return `${this.duration.minute}:${this.duration.second}`;
    }
    /**
     * Creates an AudioResource from this Track.
     */
    createAudioResource() {
        return new Promise((resolve, reject) => {
            const process = raw(
                this.url,
                {
                    o: '-',
                    q: '',
                    f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                    r: '100K',
                },
                { stdio: ['ignore', 'pipe', 'ignore'] }
            );
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
     * Creates a Track from a video URL and lifecycle callback methods.
     *
     * @param {String} url The URL of the video
     * @param methods Lifecycle callbacks
     * @returns The created Track
     */
    static async from(url, methods) {
        const info = await getInfo(url);
        // The methods are wrapped so that we can ensure that they are only called once.
        const wrappedMethods = {
            onStart() {
                wrappedMethods.onStart = noop;
                methods.onStart();
            },
            onFinish() {
                wrappedMethods.onFinish = noop;
                methods.onFinish();
            },
            onError(error) {
                wrappedMethods.onError = noop;
                methods.onError(error);
            },
        };

        return new Track({
            title: info.videoDetails.title,
            url: url,
            thumbnail: info.videoDetails.thumbnails[0].url,
            length: info.videoDetails.lengthSeconds,
            ...wrappedMethods,
        });
    }

    /**
     * Creates a Track from a video URL and lifecycle callback methods.
     *
     * @param {Track} track The URL of the video
     * @param {CommandInteraction} interaction The URL of the video
     * @returns Discord Message Embed
     */
    static generateTrackEmbed(track, interaction) {
        return new MessageEmbed()
            .setColor('#00eb55')
            .setTitle(track.title)
            .setURL(track.url)
            .setAuthor('Now playing', interaction.user.avatarURL())
            .setThumbnail(track.thumbnail)
            .addFields(
                {
                    name: 'Song Duration',
                    value: track.getTrackDuration(),
                    inline: true,
                },
                {
                    name: 'Queue Position',
                    value: `Track ${track.position}`,
                    inline: true,
                }
            )
            .setTimestamp();
    }

    setOnStart(fn) {
        const wrappedMethods = {
            onStart() {
                wrappedMethods.onStart = noop;
                fn();
            },
        };
        this.onStart = wrappedMethods.onStart;
    }

    /**
     * Creates a Track from a video URL and lifecycle callback methods.
     *
     * @param {String} playlistId The URL of the playlist
     * @param methods Lifecycle callbacks
     * @returns The created List of Track
     */
    static async fromYTPlaylist(playlistId, methods) {
        const rawInfo = await ytpl(playlistId);
        const playlistInfo = {
            playlistName: rawInfo.title,
            count: rawInfo.estimatedItemCount,
            thumbnail: rawInfo.bestThumbnail.url,
        };
        const trackList = rawInfo.items.map((info) => {
            const wrappedMethods = {
                onFinish() {
                    wrappedMethods.onFinish = noop;
                    methods.onFinish();
                },
                onError(error) {
                    wrappedMethods.onError = noop;
                    methods.onError(error);
                },
            };

            const track = new Track({
                title: info.title,
                url: info.shortUrl,
                thumbnail: info.bestThumbnail.url,
                length: info.durationSec,
                ...wrappedMethods,
            });

            return track;
        });

        return { playlistInfo, trackList };
    }

    /**
     * Creates a Track from a video URL and lifecycle callback methods.
     *
     * @param {String} playlistId The URL of the playlist
     * @param methods Lifecycle callbacks
     * @returns The created List of Track
     */
    static async fromSpotifyPlaylist(playlistId, methods) {
        const { playlistName, items } = await parsePlaylist(playlistId);
        const playlistInfo = {
            playlistName: playlistName,
            count: items.length,
            thumbnail: null,
        };
        let trackList = items.map((url) => this.from(url, methods));
        trackList = await Promise.all(trackList);
        return { playlistInfo, trackList };
    }
    /**
     * Creates a Track from a video URL and lifecycle callback methods.
     *
     * @param {String} albumId The URL of the album
     * @param methods Lifecycle callbacks
     * @returns The created List of Track
     */
    static async fromSpotifyAlbum(albumId, methods) {
        const { albumName, artists, items } = await parseAlbum(albumId);
        const playlistInfo = {
            playlistName: `${artists} - ${albumName}`,
            count: items.length,
            thumbnail: null,
        };
        let trackList = items.map((url) => this.from(url, methods));
        trackList = await Promise.all(trackList);
        return { playlistInfo, trackList };
    }

    /**
     * @param {String} url
     */
    static isPlaylist(url) {
        return ytpl.validateID(url);
    }
}

module.exports = { Track };

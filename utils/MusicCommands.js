const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { getPlaylistInfo, getVideoInfo, search } = require('youtube-scrapper');
const { MusicSubscription } = require('../structures/MusicSubscription');
const { TrackMetadata } = require('../structures/TrackMetadata');
const { embedResponse, reply } = require('../utils/Utility');

/**
 *
 * @param {Client} client
 * @param {CommandInteraction} interaction
 */
const getGuildSubscription = (client, interaction) => {
    let subscription = client.subscriptions.get(interaction.guildId);

    // check if already destroyed but still in the subscriptions map
    if (subscription && subscription.destroyed) {
        client.subscriptions.delete(interaction.guildId);
        subscription = null;
    }
    return subscription;
};

/**
 *
 * @param {Client} client
 * @param {CommandInteraction} interaction
 */
const createSubscription = (client, interaction) => {
    const channel = interaction.member.voice.channel;
    const subscription = new MusicSubscription(
        joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        })
    );
    subscription.voiceConnection.on('error', console.warn);
    client.subscriptions.set(interaction.guildId, subscription);
    return subscription;
};

/**
 * @param {CommandInteraction} interaction
 * @param {TrackMetadata} trackMetadata
 */
const trackInfoMethods = (subscription, interaction, trackMetadata) => {
    return {
        onStart: async () => {
            if (!subscription.announce) return;
            const trackInfo = new MessageEmbed()
                .setColor('#00eb55')
                .setTitle(trackMetadata.title)
                .setURL(trackMetadata.url)
                .setAuthor('Now playing', interaction.user.avatarURL())
                .setThumbnail(trackMetadata.thumbnail)
                .addFields(
                    {
                        name: 'Song Duration',
                        value: trackMetadata.length,
                        inline: true,
                    },
                    {
                        name: 'Queue Position',
                        value: `Track ${subscription.current + 1}`,
                        inline: true,
                    }
                )
                .setTimestamp();
            await reply(interaction, trackInfo);
        },
        onFinish: async () => {
            await reply(
                interaction,
                embedResponse({
                    msg: ':musical_note: **Queue finished**',
                    color: '#eb0000',
                })
            );
        },
        onError: (error) => {
            console.log(error);
        },
    };
};

/**
 * @param {String} url
 */
const isYTPlaylist = async (url) => {
    try {
        await getPlaylistInfo(url);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 *
 * @param {string} query
 */
const trackMetadataFrom = async (query, allowLive = true) => {
    const res = await search(query);
    if (!res.videos.length) throw 'No results found';
    const video = res.videos.find(async (video) => {
        const { status } = await playability(video.url);
        return (allowLive ? video.duration >= 0 : video.duration > 0) && status;
    });
    return new TrackMetadata({
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnails[0].url,
        length: video.duration / 1000,
        isLive: video.duration === 0 ? true : false,
    });
};

/**
 * Creates a Track from a video URL and lifecycle callback methods.
 *
 * @param {String} url The URL of the video
 * @returns The created TrackMetadata
 */
async function TrackMetadataFromYTUrl(url) {
    const video = await getVideoInfo(url)
        .then((video) => video)
        .catch((err) => {
            console.log(`[ERROR] URL: ${url}\nCAUSE: ${err}`);
            return null;
        });

    const playability = video.json.playabilityStatus.status === 'OK';
    if (!playability) {
        throw video.json.playabilityStatus.reason;
    }

    if (video) {
        return new TrackMetadata({
            title: video.details.title,
            url: video.details.url,
            thumbnail: video.details.thumbnails[0].url,
            length: video.details.duration / 1000,
            isLive: video.details.isLiveContent && video.details.duration === 0 ? true : false,
        });
    }
}

/**
 * Creates a Track from a video URL and lifecycle callback methods.
 *
 * @param {String} playlistId The URL of the playlist
 * @returns The created List of TrackMetadata
 */
async function TrackMetadataFromYTPlaylist(playlistId) {
    const res = await getPlaylistInfo(playlistId);
    const playlist = await res.fetch();
    const playlistInfo = {
        playlistName: playlist.title,
        count: playlist.tracks.length,
        url: playlist.url,
        thumbnail: null,
    };

    const trackList = playlist.tracks.map((video) => {
        const track = new TrackMetadata({
            title: video.title,
            url: video.url,
            thumbnail: video.thumbnails[0].url,
            length: video.duration / 1000,
            isLive: video.duration === 0 ? true : false,
        });

        return track;
    });

    return { playlistInfo, trackList };
}

async function playability(url) {
    const res = await getVideoInfo(url);
    const playability = res.json.playabilityStatus.status === 'OK';
    return {
        status: playability,
        reason: !playability ? res.json.playabilityStatus.reason : '',
    };
}

const mc = {
    getGuildSubscription,
    createSubscription,
    isYTPlaylist,
    trackInfoMethods,
    TrackMetadataFromYTPlaylist,
    TrackMetadataFromYTUrl,
    trackMetadataFrom,
};

module.exports = { mc };

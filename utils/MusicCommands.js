const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { MusicSubscription } = require('../structures/MusicSubscription');
const { joinVoiceChannel } = require('@discordjs/voice');
const ytpl = require('ytpl');
const { getInfo } = require('ytdl-core');
const { TrackMetadata } = require('../structures/TrackMetadata');
const { parsePlaylist, parseAlbum } = require('../utils/SpotifyTrack');
const { matchUrlGroups } = require('../utils/Utility');

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
 * @param {Number} trackPosition
 */
const trackInfoMethods = (interaction, trackMetadata, trackPosition) => {
    return {
        onStart: async () => {
            const trackInfo = new MessageEmbed()
                .setColor('#00eb55')
                .setTitle(trackMetadata.title)
                .setURL(trackMetadata.url)
                .setAuthor('Now playing', interaction.user.avatarURL())
                .setThumbnail(trackMetadata.thumbnail)
                .addFields(
                    {
                        name: 'Song Duration',
                        value: trackMetadata.getTrackDuration(),
                        inline: true,
                    },
                    {
                        name: 'Queue Position',
                        value: `Track ${trackPosition}`,
                        inline: true,
                    }
                )
                .setTimestamp();
            try {
                await interaction.followUp({ embeds: [trackInfo] });
            } catch (err) {
                await interaction.channel.send({ embeds: [trackInfo] });
            }
        },
        onFinish: async () => {
            const embed = new MessageEmbed()
                .setDescription(':musical_note: **Queue finished**')
                .setColor('#eb0000');
            try {
                return await interaction.followUp({
                    embeds: [embed],
                });
            } catch (error) {
                return await interaction.channel.send({
                    embeds: [embed],
                });
            }
        },
        onError: (error) => {
            console.log(error);
        },
    };
};

/**
 * @param {String} url
 */
const isYTPlaylist = (url) => {
    return ytpl.validateID(url);
};

/**
 * @param {String[]} domains
 * @param {String} url
 */
const isUrl = (domains, url) => {
    return matchUrlGroups(url).some((term) => {
        return domains.find((domain) => domain === term);
    });
};

/**
 * Creates a Track from a video URL and lifecycle callback methods.
 *
 * @param {String} url The URL of the video
 * @returns The created TrackMetadata
 */
async function TrackMetadataFromYTUrl(url) {
    const info = await getInfo(url);

    return new TrackMetadata({
        title: info.videoDetails.title,
        url: url,
        thumbnail: info.videoDetails.thumbnails[0].url,
        length: info.videoDetails.lengthSeconds,
    });
}

/**
 * Creates a Track from a video URL and lifecycle callback methods.
 *
 * @param {String} playlistId The URL of the playlist
 * @returns The created List of TrackMetadata
 */
async function TrackMetadataFromYTPlaylist(playlistId) {
    const rawInfo = await ytpl(playlistId);
    const playlistInfo = {
        playlistName: rawInfo.title,
        count: rawInfo.estimatedItemCount,
        thumbnail: rawInfo.bestThumbnail.url,
    };

    const trackList = rawInfo.items.map((info) => {
        const track = new TrackMetadata({
            title: info.title,
            url: info.shortUrl,
            thumbnail: info.bestThumbnail.url,
            length: info.durationSec,
        });

        return track;
    });

    return { playlistInfo, trackList };
}

/**
 * Creates a Track from a video URL and lifecycle callback methods.
 *
 * @param {String} playlistId The URL of the playlist
 * @returns The created List of TrackMetadata
 */
async function TrackMetadatafromSpotifyPlaylist(playlistId) {
    const { playlistName, items } = await parsePlaylist(playlistId);
    const playlistInfo = {
        playlistName: playlistName,
        count: items.length,
        thumbnail: null,
    };
    let trackList = items.map((url) => TrackMetadataFromYTUrl(url));
    trackList = await Promise.all(trackList);
    return { playlistInfo, trackList };
}

/**
 * Creates a Track from a video URL and lifecycle callback methods.
 *
 * @param {String} albumId The URL of the album
 * @returns The created List of TrackMetadata
 */
async function TrackMetadatafromSpotifyAlbum(albumId) {
    const { albumName, artists, items } = await parseAlbum(albumId);
    const playlistInfo = {
        playlistName: `${artists} - ${albumName}`,
        count: items.length,
        thumbnail: null,
    };
    let trackList = items.map((url) => TrackMetadataFromYTUrl(url));
    trackList = await Promise.all(trackList);
    return { playlistInfo, trackList };
}

const mc = {
    getGuildSubscription,
    createSubscription,
    isYTPlaylist,
    isUrl,
    trackInfoMethods,
    TrackMetadataFromYTPlaylist,
    TrackMetadataFromYTUrl,
    TrackMetadatafromSpotifyPlaylist,
    TrackMetadatafromSpotifyAlbum,
};

module.exports = { mc };

const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { getPlaylistInfo, getVideoInfo, search } = require('youtube-scrapper');
const { MusicSubscription } = require('../structures/MusicSubscription');
const { TrackMetadata } = require('../structures/TrackMetadata');
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
                        value: trackMetadata.getTrackDuration(),
                        inline: true,
                    },
                    {
                        name: 'Queue Position',
                        value: `Track ${subscription.current + 1}`,
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
const isYTPlaylist = async (url) => {
    try {
        await getPlaylistInfo(url);
        return true;
    } catch (error) {
        return false;
    }
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
 *
 * @param {string} query
 */
const trackMetadataFrom = async (query) => {
    const res = await search(query);
    if (!res.videos.length) throw 'No results found';
    const video = res.videos[0];
    return new TrackMetadata({
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnails[0].url,
        length: video.duration / 1000,
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

    if (video) {
        return new TrackMetadata({
            title: video.details.title,
            url: url,
            thumbnail: video.details.thumbnails[0].url,
            length: video.details.duration / 1000,
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
        });

        return track;
    });

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
    trackMetadataFrom,
};

module.exports = { mc };

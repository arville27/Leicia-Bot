const { MessageEmbed, CommandInteraction } = require('discord.js');
const { TrackMetadata } = require('../structures/TrackMetadata');

/**
 *
 * @param {CommandInteraction} interaction
 * @param {TrackMetadata} trackMetadata
 * @param {Number} trackPosition
 */
function singleTrackEmbed(interaction, trackMetadata, trackPosition) {
    return new MessageEmbed()
        .setColor('#c99fff')
        .setTitle(trackMetadata.title)
        .setURL(trackMetadata.url)
        .setAuthor('Added to queue', interaction.user.avatarURL())
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
}

/**
 * @typedef {{playlistName: string, count: number, thumbnail: string}} playlistInfo
 * @param {CommandInteraction} interaction
 * @param {playlistInfo} playlistInfo
 */
function albumEmbed(interaction, playlistInfo) {
    const embed = new MessageEmbed()
        .setColor('#c99fff')
        .setTitle(playlistInfo.playlistName)
        .setAuthor('Album added to queue', interaction.user.avatarURL())
        .addFields({
            name: 'Added to queue',
            value: `${playlistInfo.count}`,
        })
        .setTimestamp();
    if (playlistInfo.thumbnail) embed.setThumbnail(playlistInfo.thumbnail);
    return embed;
}

/**
 * @typedef {{playlistName: string, count: number, thumbnail: string}} playlistInfo
 * @param {CommandInteraction} interaction
 * @param {playlistInfo} playlistInfo
 */
function playlistEmbed(interaction, playlistInfo) {
    const embed = new MessageEmbed()
        .setColor('#c99fff')
        .setTitle(playlistInfo.playlistName)
        .setAuthor('Playlist added to queue', interaction.user.avatarURL())
        .addFields({
            name: 'Added to queue',
            value: `${playlistInfo.count}`,
        })
        .setTimestamp();
    if (playlistInfo.thumbnail) embed.setThumbnail(playlistInfo.thumbnail);
    return embed;
}

/**
 * @typedef {{playlistName: string, count: number, thumbnail: string}} playlistInfo
 * @param {CommandInteraction} interaction
 * @param {playlistInfo} playlistInfo
 */
function failedCreateTrack() {
    return new MessageEmbed()
        .setDescription(':octagonal_sign: **Failed to add track, please try again later!**')
        .setColor('#eb0000');
}

const response = {
    singleTrackEmbed,
    albumEmbed,
    playlistEmbed,
    failedCreateTrack,
};

module.exports = { response };

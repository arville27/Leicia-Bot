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

function notInVoiceChannel() {
    return new MessageEmbed()
        .setDescription(':octagonal_sign: **Join a voice channel and then try that again!**')
        .setColor('#eb0000');
}

function failedJoinVoiceChannel() {
    return new MessageEmbed()
        .setDescription(
            ':octagonal_sign: **Failed to join voice channel within 20 seconds, please try again later!**'
        )
        .setColor('#eb0000');
}

function noSubscriptionAvailable() {
    return new MessageEmbed()
        .setDescription(':diamond_shape_with_a_dot_inside:  Currently not playing in this server!')
        .setColor('#eb0000');
}

function firstTrackInSubscription() {
    return new MessageEmbed()
        .setDescription(':diamond_shape_with_a_dot_inside:  This is the first track in the queue')
        .setColor('#eb0000');
}

function invalidTrackNumber() {
    return new MessageEmbed()
        .setDescription(':diamond_shape_with_a_dot_inside:  Please provide a valid number')
        .setColor('#eb0000');
}

function lastTrackInQueue() {
    return new MessageEmbed()
        .setDescription(':diamond_shape_with_a_dot_inside:  The queue is already ended')
        .setColor('#eb0000');
}

/**
 *
 * @param {Number} trackNumber
 */
function successfulChangeTrack(trackNumber) {
    return new MessageEmbed()
        .setDescription(`:track_next: **Change to track no ${trackNumber}!**`)
        .setColor('#0070eb');
}

function disconnectFromVoiceChannel() {
    return new MessageEmbed()
        .setDescription(':small_red_triangle: **Disconnected from channel!**')
        .setColor('#eb0000');
}

/**
 *
 * @param {Boolean} state
 * @returns
 */
function pauseAudioPlayer(state) {
    return state
        ? new MessageEmbed().setDescription(':pause_button: **Paused!**')
        : new MessageEmbed().setDescription(':pause_button: **Already Paused!**');
}

/**
 *
 * @param {Boolean} state
 * @returns
 */
function unpauseAudioPlayer(state) {
    return state
        ? new MessageEmbed().setDescription(':arrow_forward: **Unpaused!**').setColor('#00eb55')
        : new MessageEmbed()
              .setDescription(':arrow_forward: **Already playing!**')
              .setColor('#00eb55');
}

function successfulPrevTrack() {
    return new MessageEmbed()
        .setDescription(':track_next: **Back to previous song!**')
        .setColor('#0070eb');
}

function successfulSkipTrack() {
    return new MessageEmbed().setDescription(':track_next: **Skipped song!**').setColor('#0070eb');
}

const response = {
    singleTrackEmbed,
    albumEmbed,
    playlistEmbed,
    failedCreateTrack,
    notInVoiceChannel,
    failedJoinVoiceChannel,
    noSubscriptionAvailable,
    invalidTrackNumber,
    successfulChangeTrack,
    disconnectFromVoiceChannel,
    pauseAudioPlayer,
    successfulPrevTrack,
    firstTrackInSubscription,
    unpauseAudioPlayer,
    successfulSkipTrack,
    lastTrackInQueue,
};

module.exports = { response };

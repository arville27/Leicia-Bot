const { MessageEmbed, CommandInteraction } = require('discord.js');
const { bold } = require('@discordjs/builders');
const { TrackMetadata } = require('../structures/TrackMetadata');
const { TrackMetadataFromYTUrl } = require('../utils/MusicCommands').mc;

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
        .setAuthor({
            name: 'Added to queue',
            iconURL: interaction.user.avatarURL(),
        })
        .setThumbnail(trackMetadata.thumbnail)
        .addFields(
            {
                name: 'Song Duration',
                value: trackMetadata.length,
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
function playlistEmbed(interaction, playlistInfo) {
    const embed = new MessageEmbed()
        .setColor('#c99fff')
        .setTitle(playlistInfo.playlistName)
        .setAuthor({
            name: 'Playlist added to queue',
            iconURL: interaction.user.avatarURL(),
        })
        .addFields({
            name: 'Added to queue',
            value: `${playlistInfo.count}`,
        })
        .setTimestamp();
    if (playlistInfo.thumbnail) embed.setThumbnail(playlistInfo.thumbnail);
    if (playlistInfo.url) embed.setURL(playlistInfo.url);
    return embed;
}

/**
 * @param {Number} trackNumber
 */
function successfulChangeTrack(trackNumber) {
    return new MessageEmbed()
        .setDescription(`:track_next: **Change to track no ${trackNumber}!**`)
        .setColor('#0070eb');
}

/**
 * @param {Boolean} state
 */
function pauseAudioPlayer(state) {
    return state
        ? new MessageEmbed().setDescription(':pause_button: **Paused!**')
        : new MessageEmbed().setDescription(':pause_button: **Already Paused!**');
}

/**
 * @param {Boolean} state
 */
function toggleAnnounce(state) {
    return new MessageEmbed().setDescription(
        `Announce on song start message is ${state ? bold('enabled') : bold('disabled')}`
    );
}

/**
 * @param {Boolean} state
 */
function unpauseAudioPlayer(state) {
    return state
        ? new MessageEmbed().setDescription(':arrow_forward: **Unpaused!**').setColor('#00eb55')
        : new MessageEmbed().setDescription(':arrow_forward: **Already playing!**').setColor('#00eb55');
}

/**
 * @param {String} url
 */
async function selectedMenuMessage(url) {
    const trackMetadata = await TrackMetadataFromYTUrl(url);
    return new MessageEmbed()
        .setDescription(`**Selected** [${trackMetadata.title}](${trackMetadata.url})`)
        .setColor('#0070eb');
}

/**
 * @param {Number} length length in seconds
 */
function timeoutHasBeenReached(length) {
    return new MessageEmbed()
        .setDescription(`:diamond_shape_with_a_dot_inside: **Expired after ${length} seconds**`)
        .setColor('#0070eb');
}

/**
 * @param {CommandInteraction} interaction
 */
function filterMessage(interaction) {
    return new MessageEmbed()
        .setDescription(`This only can be used by ${interaction.user}`)
        .setColor('#0070eb');
}

const others = {
    failedAddTrack: {
        msg: ':octagonal_sign: **Failed to add track, please try again later!**',
        color: '#eb0000',
    },
    notInVoiceChannel: {
        msg: ':octagonal_sign: **Please join voice channel and try again later!**',
        color: '#eb0000',
    },
    failedJoinVoiceChannel: {
        msg: ':octagonal_sign: **Failed to join voice channel within 20 seconds, please try again later!**',
        color: '#eb0000',
    },
    noSubscriptionAvailable: {
        msg: bold(':diamond_shape_with_a_dot_inside:  Currently not playing in this server!'),
        color: '#eb0000',
    },
    firstTrackInSubscription: {
        msg: ':diamond_shape_with_a_dot_inside:  This is the first track in the queue',
        color: '#eb0000',
    },
    invalidTrackNumber: {
        msg: bold(':diamond_shape_with_a_dot_inside:  Please provide valid track number'),
        color: '#eb0000',
    },
    lastTrackInQueue: {
        msg: ':diamond_shape_with_a_dot_inside:  The queue is already ended',
        color: '#eb0000',
    },
    disconnectFromVoiceChannel: {
        msg: ':small_red_triangle: **Disconnected from channel!**',
        color: '#eb0000',
    },
    noResultsFound: {
        msg: ':mag: **No results found!**',
        color: '#eb0000',
    },
    successfulPrevTrack: {
        msg: ':track_next: **Back to previous song!**',
        color: '#0070eb',
    },
    successfulSkipTrack: {
        msg: ':track_next: **Skipped song!**',
        color: '#0070eb',
    },
    selectMenuPrompt: {
        msg: '**Select a song to play!**',
        color: '#0070eb',
    },
    queueShuffled: {
        msg: '**Queue shuffled!**',
        color: '#0070eb',
    },
    queueIsEmpty: {
        msg: ':diamond_shape_with_a_dot_inside:  **The queue is empty**',
        color: '#eb0000',
    },
    invalidPlaylistName: {
        msg: bold('Invalid playlist name'),
        color: '#eb0000',
    },
    generalError: {
        msg: `${bold('Unknown error')}\nPlease try again later.`,
        color: '#eb0000',
    },
    noPlaylist: {
        msg: bold(`You don't have any playlist or the playlist is does not exists`),
        color: '#eb0000',
    },
    insufficentPerm: {
        msg: "You don't have permission to use this command!",
        color: '#eb0000',
    },
    serverError: {
        msg: bold('Server error, try again later'),
        color: '#eb0000',
    },
    queueFinished: {
        msg: ':musical_note: **Queue finished**',
        color: '#eb0000',
    },
};

const response = {
    singleTrackEmbed,
    playlistEmbed,
    successfulChangeTrack,
    pauseAudioPlayer,
    timeoutHasBeenReached,
    selectedMenuMessage,
    unpauseAudioPlayer,
    filterMessage,
    toggleAnnounce,
    others,
};

module.exports = response;

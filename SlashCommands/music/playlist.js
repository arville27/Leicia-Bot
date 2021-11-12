const { Client, CommandInteraction, MessageEmbed, MessageButton } = require('discord.js');
const { SlashCommandBuilder, inlineCode, bold, hyperlink } = require('@discordjs/builders');
const paginationEmbed = require('../../utils/EmbedPagination');
const SavedPlaylist = require('../../models/SavedPlaylist');
const resp = require('../../responses/MusicCommandsResponse');
const { embedResponse, reply, truncateString } = require('../../utils/Utility');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('playlist')
        .setDescription("List of user's playlist")
        .addStringOption((input) =>
            input.setName('name').setDescription('Playlist name to see details')
        ),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply();

        const query = { author: interaction.user.id };
        const playlistName = interaction.options.getString('name');
        if (playlistName) query._id = playlistName;
        const playlists = await SavedPlaylist.find(query).catch(async (err) => {
            return await reply(interaction, embedResponse(resp.others.generalError));
        });

        if (playlists.length === 0) {
            return await reply(interaction, embedResponse(resp.others.noPlaylist));
        }

        let pages;
        if (!playlistName) {
            let maxPage = Math.ceil(playlists.length / 10);
            const playlistNames = [];
            for (let i = 0; i < maxPage; i++) {
                let startIdx = i * 10;
                let endIdx = (i + 1) * 10;
                playlistNames.push(
                    playlists
                        .slice(startIdx, endIdx)
                        .map(
                            (playlist, index) =>
                                `${inlineCode(index + 1)} ${truncateString(playlist._id, 60)}`
                        )
                        .join('\n')
                );
            }

            pages = playlistNames.map((playlistInfo) => {
                return new MessageEmbed()
                    .setColor('#93C5F7')
                    .setAuthor(`${interaction.user.username}'s`, interaction.user.avatarURL())
                    .setTitle(`Saved Playlists (${playlists.length} playlists)`)
                    .setDescription(playlistInfo);
            });
        } else {
            const tracks = playlists[0].tracks;
            let maxPage = Math.ceil(tracks.length / 10);
            const tracksInfos = [];
            for (let i = 0; i < maxPage; i++) {
                let startIdx = i * 10;
                let endIdx = (i + 1) * 10;
                tracksInfos.push(
                    tracks
                        .slice(startIdx, endIdx)
                        .map(
                            (track, index) =>
                                `${inlineCode(index + 1)} ${hyperlink(
                                    truncateString(track.title, 30),
                                    track.url
                                )}`
                        )
                        .join('\n')
                );
            }

            pages = tracksInfos.map((tracksInfo) => {
                return new MessageEmbed()
                    .setColor('#93C5F7')
                    .setAuthor(`${interaction.user.username}'s`, interaction.user.avatarURL())
                    .setTitle(
                        bold(`${truncateString(playlists[0]._id, 30)} (${tracks.length} tracks)`)
                    )
                    .setDescription(tracksInfo);
            });
        }

        //create an array of buttons
        const buttonList = [
            new MessageButton().setCustomId('previousbtn').setLabel('Previous').setStyle('DANGER'),
            new MessageButton().setCustomId('nextbtn').setLabel('Next').setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('caller')
                .setLabel(`Called by ${interaction.user.tag}`)
                .setStyle('SECONDARY')
                .setDisabled(true),
        ];

        paginationEmbed(interaction, pages, buttonList);
    },
};

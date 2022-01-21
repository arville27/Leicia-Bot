const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder, inlineCode, bold } = require('@discordjs/builders');
const SavedPlaylist = require('../../models/SavedPlaylist');
const resp = require('../../responses/MusicCommandsResponse');
const { embedResponse, truncateString, reply } = require('../../utils/Utility');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('rmplaylist')
        .setDescription("Remove user's playlist")
        .addStringOption((input) =>
            input.setName('name').setDescription('Playlist name to remove').setRequired(true)
        ),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply();

        // check if connected to db
        if (!client.isDatabaseConnected) {
            return await reply(interaction, embedResponse(resp.others.serverError));
        }

        const playlistName = interaction.options.getString('name');
        const query = { author: interaction.user.id, _id: playlistName };

        const response = await SavedPlaylist.deleteOne(query);

        if (response.deletedCount === 0) {
            await reply(interaction, embedResponse(resp.others.invalidPlaylistName));
        } else {
            await reply(
                interaction,
                embedResponse({
                    msg: bold(
                        `Successfully delete playlist ${inlineCode(
                            truncateString(playlistName, 30)
                        )}`
                    ),
                    color: '#0070eb',
                })
            );
        }
    },
};

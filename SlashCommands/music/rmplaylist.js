const { Client, CommandInteraction, MessageEmbed, MessageButton } = require('discord.js');
const { SlashCommandBuilder, inlineCode, bold, hyperlink } = require('@discordjs/builders');
const SavedPlaylist = require('../../models/SavedPlaylist');
const { embedResponse, truncateString } = require('../../utils/Utility');

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

        const playlistName = interaction.options.getString('name');
        const query = { author: interaction.user.id, _id: playlistName };

        const resp = await SavedPlaylist.deleteOne(query);
        // console.log(resp);
        if (resp.deletedCount === 0) {
            await interaction.followUp({
                embeds: [embedResponse({ msg: bold('Invalid playlist name'), color: '#eb0000' })],
            });
        } else {
            await interaction.followUp({
                embeds: [
                    embedResponse({
                        msg: bold(
                            `Successfully delete playlist ${inlineCode(
                                truncateString(playlistName, 30)
                            )}`
                        ),
                        color: '#0070eb',
                    }),
                ],
            });
        }
    },
};

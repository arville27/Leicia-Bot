const {
    Client,
    CommandInteraction,
    MessageActionRow,
    MessageSelectMenu,
    GuildMember,
} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const ytsr = require('ytsr');
const { response } = require('../../responses/MusicCommandsResponse');
const { promisify } = require('util');
const selectMenu = require('../../utils/EmbedSelectMenu');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search music on Youtube')
        .addStringOption((option) =>
            option.setName('terms').setDescription('Keyword to identify a song').setRequired(true)
        ),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: false });

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await interaction.followUp({
                embeds: [response.notInVoiceChannel()],
            });
        }

        const terms = interaction.options.getString('terms');
        const results = await ytsr(terms, { limit: 20 });
        const listSong = results.items
            .filter((item) => item.type === 'video')
            .map((item) => {
                return {
                    label: item.title,
                    description: `Channel: ${item.author.name}\t Duration: ${item.duration}`,
                    value: item.url,
                };
            });

        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('song')
                .setPlaceholder('Nothing selected')
                .addOptions(listSong)
        );

        if (listSong.length == 0) {
            return await interaction.followUp({ embeds: [response.noResultsFound()] });
        }

        selectMenu(client, interaction, row);
    },
};

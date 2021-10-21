const {
    Client,
    CommandInteraction,
    MessageActionRow,
    MessageSelectMenu,
    GuildMember,
} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { search } = require('youtube-scrapper');
const { response } = require('../../responses/MusicCommandsResponse');
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
        const results = await search(terms);
        const listSong = results.videos.map((video) => {
            return {
                label: video.title,
                description: `Channel: ${video.author.name}\t Duration: ${video.duration / 1000}`,
                value: video.url,
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

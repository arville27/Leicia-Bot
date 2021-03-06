const {
    Client,
    CommandInteraction,
    MessageActionRow,
    MessageSelectMenu,
    GuildMember,
} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { search } = require('youtube-scrapper');
const { embedResponse, reply } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');
const selectMenu = require('../../utils/EmbedSelectMenu');
const { TrackMetadata } = require('../../structures/TrackMetadata');
const play = require('./play');

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
        await interaction.deferReply();

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await reply(interaction, embedResponse(resp.others.notInVoiceChannel));
        }

        const terms = interaction.options.getString('terms');
        const results = await search(terms);
        const listSong = results.videos.map((video) => {
            return {
                label: video.title,
                description: `Channel: ${
                    video.author.name
                }\t Duration: ${TrackMetadata.getTrackDuration(video.duration / 1000)}`,
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
            return await reply(interaction, embedResponse(resp.others.noResultsFound));
        }

        selectMenu(
            client,
            interaction,
            row,
            async (componentInteraction) => {
                await play.run(client, componentInteraction, componentInteraction.values);
            },
            true
        );
    },
};

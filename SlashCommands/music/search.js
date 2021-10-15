const {
    Client,
    CommandInteraction,
    MessageActionRow,
    MessageSelectMenu,
    MessageEmbed,
    GuildMember,
} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const ytsr = require('ytsr');
const play = require('./play');
const { response } = require('../../responses/MusicCommandsResponse');

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
        await interaction.deferReply({ ephemeral: true });

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

        if (listSong.length > 0) {
            await interaction.followUp({
                content: 'Select a song that you want to play',
                components: [row],
            });
        } else {
            return await interaction.followUp('There is no such song');
        }

        // Selection Menu collector
        const filter = (componentInteraction) =>
            componentInteraction.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            max: 1,
            time: 30 * 1000,
            componentType: 'SELECT_MENU',
        });

        collector.on('collect', async (componentInteraction) => {
            // console.log(componentInteraction.values[0]);
            // await componentInteraction.update({
            //     content: ':diamond_shape_with_a_dot_inside: Already selected',
            //     components: [],
            // });
            await play.run(client, componentInteraction, componentInteraction.values).catch(() => {
                console.log('probably already dismissed');
            });
        });
    },
};

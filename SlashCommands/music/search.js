const {
    Client,
    CommandInteraction,
    MessageActionRow,
    MessageSelectMenu,
    GuildMember,
} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const ytsr = require('ytsr');
const play = require('./play');
const { response } = require('../../responses/MusicCommandsResponse');
const { promisify } = require('util');
const wait = promisify(setTimeout);

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

        const master = await interaction.followUp({
            embeds: [response.selectMenuPrompt()],
            components: [row],
        });

        // Selection Menu collector
        const filter = (componentInteraction) => {
            if (componentInteraction.user.id === interaction.user.id) return true;
            interaction.channel
                .send({ embeds: [response.filterMessage(interaction)] })
                .then(async (msg) => {
                    await wait(8_000);
                    msg.delete();
                })
                .catch(() => void 0);
            return false;
        };
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            max: 1,
            time: 30 * 1000,
            componentType: 'SELECT_MENU',
        });

        collector.on('collect', async (componentInteraction) => {
            await play.run(client, componentInteraction, componentInteraction.values);
        });

        collector.on('end', async () => {
            if (!master.deleted) {
                await master
                    .edit({
                        embeds: [response.selectedMenuMessage()],
                        components: [],
                    })
                    .catch(() => console.log('[ERROR] Select menu already deleted'));
            }
        });
    },
};

const { MessageButton, MessageActionRow, CommandInteraction } = require('discord.js');
const { response } = require('../responses/MusicCommandsResponse');
const { promisify } = require('util');
const wait = promisify(setTimeout);
const play = require('../SlashCommands/music/play');

/**
 * Creates a select menu embed
 * @param {CommandInteraction} interaction
 * @param {MessageActionRow} row
 * @param {MessageButton[]} buttonList
 * @param {number} timeout
 * @returns
 */
const selectMenu = async (client, interaction, row) => {
    //has the interaction already been deferred? If not, defer the reply.
    if (interaction.deferred === false) {
        await interaction.deferReply();
    }

    const master = await interaction.editReply({
        embeds: [response.selectMenuPrompt()],
        components: [row],
        fetchReply: true,
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
    const collector = master.createMessageComponentCollector({
        filter,
        max: 1,
        time: 120 * 1000,
        componentType: 'SELECT_MENU',
    });

    collector.on('collect', async (componentInteraction) => {
        await play.run(client, componentInteraction, componentInteraction.values);
    });

    collector.on('end', async (collections) => {
        if (!master.deleted) {
            const res =
                collections.size > 0
                    ? await response.selectedMenuMessage(collections.first().values[0])
                    : response.timeoutHasBeenReached(120);
            await master
                .edit({
                    embeds: [res],
                    components: [],
                })
                .catch(() => console.log('[ERROR] Select menu already deleted'));
        }
    });

    return master;
};

module.exports = selectMenu;

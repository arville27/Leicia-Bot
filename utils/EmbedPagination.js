const { MessageActionRow, MessageEmbed, MessageButton, CommandInteraction } = require('discord.js');
const resp = require('../responses/MusicCommandsResponse');
const { promisify } = require('util');
const wait = promisify(setTimeout);

/**
 * Creates a pagination embed
 * @param {CommandInteraction} interaction
 * @param {MessageEmbed[]} pages
 * @param {MessageButton[]} buttonList
 * @param {number} timeout
 * @returns
 */
const paginationEmbed = async (interaction, pages, buttonList, timeout = 60_000) => {
    if (!pages) throw new Error('Pages are not given.');
    if (!buttonList) throw new Error('Buttons are not given.');
    if (buttonList[0].style === 'LINK' || buttonList[1].style === 'LINK')
        throw new Error('Link buttons are not supported with discordjs-button-pagination');
    if (buttonList.length < 2) throw new Error('Need two or more buttons.');

    let page = 0;

    const row = new MessageActionRow().addComponents(buttonList);

    //has the interaction already been deferred? If not, defer the reply.
    if (interaction.deferred == false) {
        await interaction.deferReply();
    }

    const curPage = await interaction.editReply({
        embeds: [pages[page].setFooter(`Page ${page + 1} / ${pages.length}`)],
        components: [row],
        fetchReply: true,
    });

    const filter = (i) => {
        const validId =
            i.customId === buttonList[0].customId || i.customId === buttonList[1].customId;
        if (validId && i.user === interaction.user) return true;
        else if (validId) {
            i.channel
                .send({ embeds: [resp.filterMessage(interaction)] })
                .then(async (msg) => {
                    await wait(8_000);
                    msg.delete();
                })
                .catch(() => void 0);
        }
        return false;
    };

    const collector = await curPage.createMessageComponentCollector({
        filter,
        time: timeout,
    });

    collector.on('collect', async (i) => {
        switch (i.customId) {
            case buttonList[0].customId:
                page = page > 0 ? --page : pages.length - 1;
                break;
            case buttonList[1].customId:
                page = page + 1 < pages.length ? ++page : 0;
                break;
            default:
                break;
        }
        await i.deferUpdate();
        await i.editReply({
            embeds: [pages[page].setFooter(`Page ${page + 1} / ${pages.length}`)],
            components: [row],
        });
        collector.resetTimer();
    });

    collector.on('end', async () => {
        if (!curPage.deleted) {
            // const disabledRow = new MessageActionRow().addComponents(
            //     buttonList[0].setDisabled(true),
            //     buttonList[1].setDisabled(true)
            // );
            // curPage.edit({
            //     embeds: [pages[page].setFooter(`Page ${page + 1} / ${pages.length}`)],
            //     components: [disabledRow],
            // });
            await curPage.delete().catch(() => void 0);
        }
    });

    return curPage;
};

module.exports = paginationEmbed;

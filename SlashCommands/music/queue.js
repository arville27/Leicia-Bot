const { Client, CommandInteraction, MessageEmbed, MessageButton } = require('discord.js');
const { SlashCommandBuilder, bold, inlineCode } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const paginationEmbed = require('../../utils/EmbedPagination');
const { embedResponse, reply } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder().setName('queue').setDescription('See the music queue'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: false });
        const subscription = getGuildSubscription(client, interaction);

        if (!subscription) {
            return await reply(interaction, embedResponse(resp.others.noSubscriptionAvailable));
        } else if (subscription && subscription.queue.length == 0) {
            // subscription is created, by the queue is empty
            return await reply(interaction, embedResponse(resp.others.queueIsEmpty));
        }

        const generateTrackInfo = (no, track) => {
            const number = `${no}`.padStart(2, 0);
            const title = `${track.title.substr(0, 30)}${track.title.length > 30 ? '...' : ''}`;
            const duration = track.length;
            const url = track.url;
            return no
                ? `${inlineCode(number)} [${title}](${url}) ${duration}`
                : `[${title}](${url}) ${duration}`;
        };

        let maxPage = Math.ceil(subscription.queue.length / 10);
        const trackInfo = [];
        for (let i = 0; i < maxPage; i++) {
            let startIdx = i * 10;
            let endIdx = (i + 1) * 10;
            trackInfo.push(
                subscription.queue
                    .slice(startIdx, endIdx)
                    .map((track, index) => generateTrackInfo(startIdx + index + 1, track))
                    .join('\n')
            );
        }

        const { index, track } = subscription.getCurrentTrack();
        const currTrackInfo = track
            ? generateTrackInfo(null, track)
            : bold('**Currently not playing**');

        const pages = trackInfo.map((list) => {
            return new MessageEmbed()
                .setColor('#93C5F7')
                .setTitle(`Music Queue (${subscription.queue.length} tracks)`)
                .addField(
                    track
                        ? `Now Playing ${inlineCode(`(Track ${index + 1})`)}`
                        : `At the end of the queue`,
                    `${currTrackInfo}\n\n${list}`
                );
        });

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

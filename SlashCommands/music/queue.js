const { Client, CommandInteraction, MessageEmbed, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const paginationEmbed = require('../../utils/EmbedPagination');
const { response } = require('../../responses/MusicCommandsResponse');

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
            return await interaction.followUp({
                embeds: [response.noSubscriptionAvailable()],
            });
        } else if (subscription && subscription.queue.length == 0) {
            // subscription is created, by the queue is empty
            return await interaction.followUp({
                embeds: [response.queueIsEmpty()],
            });
        }

        const generateTrackInfo = (no, track) => {
            const number = `${no}`.padStart(2, 0);
            const title = `${track.title.substr(0, 30)}${track.title.length > 30 ? '...' : ''}`;
            const duration = track.duration;
            const url = track.url;
            return no
                ? `\`「${number}」\` [${title}](${url}) ${duration}`
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

        const currTrack = subscription.getCurrentTrack();
        const currTrackInfo = currTrack
            ? generateTrackInfo(null, currTrack)
            : 'Currently not playing';
        const pages = trackInfo.map((list) => {
            return new MessageEmbed()
                .setColor('#93C5F7')
                .setTitle(`Music Queue (${subscription.queue.length} tracks)`)
                .addField('Now Playing', `${currTrackInfo}\n\n${list}`);
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

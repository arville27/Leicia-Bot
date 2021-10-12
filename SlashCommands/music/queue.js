const { Client, CommandInteraction, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

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
        // Print out the current queue, including up to the next 5 tracks to be played.
        let subscription = client.subscriptions.get(interaction.guildId);

        // check if already destroyed but still in the subscriptions map
        if (subscription && subscription.destroyed) {
            client.subscriptions.delete(interaction.guildId);
            subscription = null;
        }

        if (!subscription) {
            return await interaction.followUp({
                content: ':diamond_shape_with_a_dot_inside:  Currently not playing in this server!',
            });
        }

        let page = 0;
        let maxPage = Math.ceil(subscription.queue.length / 20);
        const queue = [];
        for (let i = 0; i < maxPage; i++) {
            let startIdx = i * 20;
            let endIdx = (i + 1) * 20;
            queue.push(
                subscription.queue
                    .slice(startIdx, endIdx)
                    .map((track, index) => {
                        const no = `${startIdx + index + 1}`.padStart(2, 0);
                        const title = `「${no}」 ${track.title.substr(0, 40)}${
                            track.title.length > 40 ? '...' : ''
                        }`;
                        if (startIdx + index + 1 === subscription.current) {
                            return `${title}\n      ⬐ current track`;
                        } else if (startIdx + index - 1 === subscription.current) {
                            return `      ⬑ current track\n${title}`;
                        }
                        return `${title}`;
                    })
                    .join('\n')
            );
        }
        const button = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('prev')
                    .setLabel('Previous Page')
                    .setStyle('PRIMARY')
                    .setDisabled(true)
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('next')
                    .setLabel('Next Page')
                    .setStyle('PRIMARY')
                    .setDisabled(maxPage > 1 ? false : true)
            );

        const master = await interaction.followUp({
            content: `\`\`\`\n${queue[page]}\n\`\`\``,
            components: [button],
        });

        // Button collector
        const filter = (buttonInteract) => buttonInteract.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 30 * 1000,
        });

        collector.on('collect', async (buttonInteract) => {
            const updateButton = async (buttonInteract) => {
                await buttonInteract.update({
                    content: `\`\`\`\n${queue[page]}\n\`\`\``,
                    components: [
                        new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('prev')
                                    .setLabel('Previous Page')
                                    .setStyle('PRIMARY')
                                    .setDisabled(page === 0)
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('next')
                                    .setLabel('Next Page')
                                    .setStyle('PRIMARY')
                                    .setDisabled(page === maxPage - 1 ? true : false)
                            ),
                    ],
                });
            };

            if (buttonInteract.customId === 'next') {
                page += page + 1 < maxPage ? 1 : 0;
                updateButton(buttonInteract);
            } else if (buttonInteract.customId === 'prev') {
                page -= page - 1 < 0 ? 0 : 1;
                updateButton(buttonInteract);
            }
        });

        collector.on('end', async () => {
            try {
                await master.edit({
                    content: `\`\`\`\n${queue[page]}\n\`\`\``,
                    components: [],
                });
            } catch (err) {
                console.log('The message already dismissed');
            }
        });
    },
};

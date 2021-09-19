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
        await interaction.deferReply().catch(() => {});
        // Print out the current queue, including up to the next 5 tracks to be played.
        let subscription = client.subscriptions.get(interaction.guildId);
        if (!subscription) {
            return await interaction.reply({
                content: ':diamond_shape_with_a_dot_inside:  Currently not playing in this server!',
                ephemeral: true,
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
                        const no = `${index + 1}`.padStart(2, 0);
                        const title = `「${no}」 ${track.title.substr(0, 50)}${
                            track.title.length > 50 ? '...' : ''
                        }`;
                        if (index + 1 === subscription.current) {
                            return `${title}\n      ⬐ current track`;
                        } else if (index - 1 === subscription.current) {
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
            )
            .addComponents(
                new MessageButton().setCustomId('next').setLabel('Next Page').setStyle('PRIMARY')
            );

        const master = await interaction.followUp({
            content: `\`\`\`\n${queue[page]}\n\`\`\``,
            components: [button],
        });

        // Button collector
        const filter = (buttonInteract) => buttonInteract.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 60 * 1000,
        });

        collector.on('collect', async (buttonInteract) => {
            const beforeChange = page;
            if (buttonInteract.customId === 'next') {
                page += page + 1 < maxPage ? 1 : 0;
            } else if (buttonInteract.customId === 'prev') {
                page -= page - 1 >= 0 ? 1 : 0;
            }

            if (beforeChange != page) {
                await buttonInteract.update({
                    content: `\`\`\`\n${queue[page]}\n\`\`\``,
                    components: [button],
                });
            } else {
                await buttonInteract.reply({ content: 'This is the last page', ephemeral: true });
            }
        });

        collector.on('end', async () => {
            await master.edit({
                content: `\`\`\`\n${queue[page]}\n\`\`\``,
                components: [],
            });
        });
    },
};

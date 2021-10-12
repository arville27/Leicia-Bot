const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete messages that not older than 14 days')
        .addIntegerOption((option) =>
            option
                .setName('amount')
                .setDescription('The amount of message to purge, default 5, max 100')
        )
        .setDefaultPermission(false),
    userPermissions: ['MANAGE_MESSAGES'],
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        let amount = interaction.options.getInteger('amount');
        let canBeDeleted = 0;

        const filterMessage = (message) => {
            const condition = (Date.now() - message.createdTimestamp) / (1000 * 60 * 60 * 24) < 14;
            if (condition) canBeDeleted++;
            return condition;
        };

        let messages = null;
        if (!amount) {
            messages = await interaction.channel.messages
                .fetch({ limit: 100 })
                .then((messages) => messages.filter(filterMessage));
            amount = 0;
        } else if (amount < 100) {
            messages = await interaction.channel.messages
                .fetch({ limit: amount })
                .then((messages) => messages.filter(filterMessage));
        } else {
            return await interaction.editReply({
                content: `Amount is should be less than 100`,
            });
        }

        await interaction.channel.bulkDelete(messages);
        if (canBeDeleted < amount) {
            await interaction.editReply({
                content: `Successfuly delete ${canBeDeleted} message(s), the rest cannot be deleted`,
            });
        } else {
            await interaction.editReply({
                content: `Successfuly delete ${canBeDeleted} message(s)`,
            });
        }
    },
};

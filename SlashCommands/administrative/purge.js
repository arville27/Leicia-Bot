const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder, inlineCode } = require('@discordjs/builders');
const { embedResponse, reply } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

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
        // Check permissions
        const permToCheck = 'MANAGE_MESSAGES';
        const permissions = interaction.channel.permissionsFor(interaction.guild.me);
        if (!permissions.has(permToCheck)) {
            return await reply(
                interaction,
                embedResponse({
                    msg: `I dont have permission to do that! (${inlineCode(permToCheck)})`,
                    color: '#eb0000',
                })
            );
        }
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
                .then((messages) => messages.filter(filterMessage))
                .catch((err) => console.warn('Error while fetching messages'));
            amount = 0;
        } else if (amount < 100) {
            messages = await interaction.channel.messages
                .fetch({ limit: amount })
                .then((messages) => messages.filter(filterMessage));
        } else {
            return await reply(
                interaction,
                embedResponse({
                    msg: `Amount is should be less than 100`,
                    color: '#eb0000',
                })
            );
        }

        try {
            await interaction.channel.bulkDelete(messages);
        } catch (error) {
            console.log('[ERROR] There is a message that cannot be deleted');
        }
        if (canBeDeleted < amount) {
            await reply(
                interaction,
                embedResponse({
                    msg: `Successfuly delete ${canBeDeleted} message(s), the rest cannot be deleted`,
                    color: '#0070eb',
                })
            );
        } else {
            await reply(
                interaction,
                embedResponse({
                    msg: `Successfuly delete ${canBeDeleted} message(s)`,
                    color: '#0070eb',
                })
            );
        }
    },
};

const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder, inlineCode } = require('@discordjs/builders');
const { embedResponse, reply, stdLog } = require('../../utils/Utility');

module.exports = {
    ...new SlashCommandBuilder().setName('clear').setDescription('Delete bot responses'),
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
        const messages = await interaction.channel.messages
            .fetch({ limit: 100 })
            .then((messages) =>
                messages.filter(
                    (message) =>
                        message.author.id === client.user.id &&
                        (Date.now() - message.createdTimestamp) / (1000 * 60 * 60 * 24) < 14
                )
            )
            .catch(() => stdLog(1, { extra: '[clear] Error while fetching messages' }));

        try {
            await interaction.channel.bulkDelete(messages);
        } catch (error) {
            stdLog(1, { extra: '[clear] There is a message that cannot be deleted' });
        }
        await reply(
            interaction,
            embedResponse({
                msg: `Successfully clean bot response`,
                color: '#0070eb',
            })
        );
    },
};

const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

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
            return await interaction.followUp(
                `I dont have permission to do that! (PERM: ${permToCheck})`
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
            );

        await interaction.channel.bulkDelete(messages);
        await interaction.editReply({
            content: 'Successfully clean bot responses',
        });
    },
};

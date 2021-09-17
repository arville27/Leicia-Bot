const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    ...new SlashCommandBuilder().setName('leave').setDescription('Leave the voice channel'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        let subscription = client.subscriptions.get(interaction.guildId);
        if (subscription) {
            subscription.voiceConnection.destroy();
            client.subscriptions.delete(interaction.guildId);
            await interaction.reply({ content: `Left channel!`, ephemeral: true });
        } else {
            await interaction.reply('Not playing in this server!');
        }
    },
};

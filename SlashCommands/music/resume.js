const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume playback of the current song'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        let subscription = client.subscriptions.get(interaction.guildId);
        if (subscription) {
            subscription.audioPlayer.unpause();
            await interaction.reply({ content: `Unpaused!`, ephemeral: true });
        } else {
            await interaction.reply('Not playing in this server!');
        }
    },
};

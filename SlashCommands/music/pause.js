const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    entersState,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionStatus,
} = require('@discordjs/voice');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the song that is currently playing'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        let subscription = client.subscriptions.get(interaction.guildId);
        if (subscription) {
            subscription.audioPlayer.pause();
            await interaction.reply({ content: `Paused!`, ephemeral: true });
        } else {
            await interaction.reply('Not playing in this server!');
        }
    },
};

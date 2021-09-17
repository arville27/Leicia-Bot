const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    ...new SlashCommandBuilder().setName('queue').setDescription('See the music queue'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        // Print out the current queue, including up to the next 5 tracks to be played.
        let subscription = client.subscriptions.get(interaction.guildId);
        if (subscription) {
            const current =
                subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
                    ? `Nothing is currently playing!`
                    : `Playing **${subscription.audioPlayer.state.resource.metadata.title}**`;

            const queue = subscription.queue
                .slice(0, 5)
                .map((track, index) => `${index + 1}) ${track.title}`)
                .join('\n');

            await interaction.reply(`${current}\n\n${queue}`);
        } else {
            await interaction.reply('Not playing in this server!');
        }
    },
};

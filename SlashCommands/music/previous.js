const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('prev')
        .setDescription('Back to the previous song in the queue'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: false });
        let subscription = client.subscriptions.get(interaction.guildId);

        // check if already destroyed but still in the subscriptions map
        if (subscription && subscription.destroyed) {
            client.subscriptions.delete(interaction.guildId);
            subscription = null;
        }

        if (subscription) {
            // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
            // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
            // will be loaded and played.
            if (subscription.current < 1) {
                return await interaction.followUp({
                    content:
                        ':diamond_shape_with_a_dot_inside:  This is the first track in the queue',
                });
            }
            subscription.prev();
            await interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setDescription(':track_next: **Back to previous song!**')
                        .setColor('#0070eb'),
                ],
            });
        } else {
            await interaction.followUp({
                content: ':diamond_shape_with_a_dot_inside:  Currently not playing in this server!',
            });
        }
    },
};

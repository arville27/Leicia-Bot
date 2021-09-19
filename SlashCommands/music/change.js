const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('change')
        .setDescription('Change to any track in the queue')
        .addIntegerOption((option) =>
            option.setName('no').setDescription('Track number you want to play').setRequired(true)
        ),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        let subscription = client.subscriptions.get(interaction.guildId);
        if (subscription) {
            // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
            // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
            // will be loaded and played.
            const trackNumber = interaction.options.getInteger('no');
            console.log(subscription.size);
            if (trackNumber >= subscription.size || trackNumber < 1) {
                return await interaction.reply({
                    content: ':diamond_shape_with_a_dot_inside:  Please provide a valid number',
                    ephemeral: true,
                });
            }

            subscription.changeTrack(trackNumber);
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`:track_next: **Change to track no ${trackNumber}!**`)
                        .setColor('#0070eb'),
                ],
            });
        } else {
            await interaction.reply({
                content: ':diamond_shape_with_a_dot_inside:  Currently not playing in this server!',
                ephemeral: true,
            });
        }
    },
};

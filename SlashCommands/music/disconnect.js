const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    ...new SlashCommandBuilder().setName('dc').setDescription('Disconnect from the voice channel'),
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
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(':small_red_triangle: **Disconnected from channel!**')
                        .setColor('#eb0000'),
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

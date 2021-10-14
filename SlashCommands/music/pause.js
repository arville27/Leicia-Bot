const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands');

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
        await interaction.deferReply({ ephemeral: false });
        const subscription = getGuildSubscription(client, interaction);

        if (!subscription) {
            return await interaction.followUp({
                content: ':diamond_shape_with_a_dot_inside:  Currently not playing in this server!',
            });
        }

        // subscription.pause() will return true if current audioPlayer state is Playing
        if (subscription.pause()) {
            await interaction.followUp({
                embeds: [new MessageEmbed().setDescription(':pause_button: **Paused!**')],
            });
        } else {
            await interaction.followUp({
                embeds: [new MessageEmbed().setDescription(':pause_button: **Already Paused!**')],
            });
        }
    },
};

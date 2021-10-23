const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder, bold } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { response } = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Toggles whether Leicia will announce when songs start playing'),
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
                embeds: [response.noSubscriptionAvailable()],
            });
        }

        subscription.announce = !subscription.announce;

        const embed = new MessageEmbed().setDescription(
            `Announce on start message is set to ${
                subscription.announce ? bold('ON') : bold('OFF')
            }`
        );
        try {
            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            await interaction.channel.send({ embeds: [embed] });
        }
    },
};

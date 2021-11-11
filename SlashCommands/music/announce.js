const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { embedResponse } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

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
        await interaction.deferReply();

        const subscription = getGuildSubscription(client, interaction);

        if (!subscription) {
            return await interaction.followUp({
                embeds: [embedResponse(resp.others.noSubscriptionAvailable)],
            });
        }

        subscription.announce = !subscription.announce;

        const embed = resp.toggleAnnounce(subscription.announce);
        try {
            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            await interaction.channel.send({ embeds: [embed] });
        }
    },
};

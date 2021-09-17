const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    ...new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: false }).catch(() => {});
        await interaction.editReply({ content: `Pong! (${client.ws.ping} ms)` });
    },
};

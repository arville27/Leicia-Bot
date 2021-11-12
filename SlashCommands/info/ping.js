const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reply } = require('../../utils/Utility');

module.exports = {
    ...new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply();

        const embed = new MessageEmbed().addFields({
            name: '🏓 Pong!',
            value: `Latency is ${Date.now() - interaction.createdTimestamp} ms\nAPI Latency! (${
                client.ws.ping
            } ms)`,
        });
        await reply(interaction, embed);
    },
};

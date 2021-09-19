const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
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
        await interaction.deferReply();
        await interaction.followUp({
            embeds: [
                new MessageEmbed().addFields({
                    name: '🏓 Pong!',
                    value: `Latency is ${
                        Date.now() - interaction.createdTimestamp
                    } ms\nAPI Latency! (${client.ws.ping} ms)`,
                }),
            ],
        });
    },
};

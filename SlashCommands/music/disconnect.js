const { Client, CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands');

module.exports = {
    ...new SlashCommandBuilder().setName('dc').setDescription('Disconnect from the voice channel'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: false });

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setDescription(
                            ':octagonal_sign: **Join a voice channel and then try that again!**'
                        )
                        .setColor('#eb0000'),
                ],
            });
        }

        let subscription = getGuildSubscription(client, interaction);
        if (!subscription) {
            return await interaction.followUp({
                content: ':diamond_shape_with_a_dot_inside:  Currently not playing in this server!',
            });
        }

        subscription.voiceConnection.destroy();
        client.subscriptions.delete(interaction.guildId);
        await interaction.followUp({
            embeds: [
                new MessageEmbed()
                    .setDescription(':small_red_triangle: **Disconnected from channel!**')
                    .setColor('#eb0000'),
            ],
        });
    },
};

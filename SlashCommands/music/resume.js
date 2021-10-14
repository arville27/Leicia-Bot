const { Client, CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;

module.exports = {
    ...new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume playback of the current song'),
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

        const subscription = getGuildSubscription(client, interaction);

        if (!subscription) {
            return await interaction.followUp({
                content: ':diamond_shape_with_a_dot_inside:  Currently not playing in this server!',
            });
        }

        // subscription.resume() will return true if current audioPlayer state is paused
        if (subscription.resume()) {
            await interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setDescription(':arrow_forward: **Unpaused!**')
                        .setColor('#00eb55'),
                ],
            });
        } else {
            await interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setDescription(':arrow_forward: **Already playing!**')
                        .setColor('#00eb55'),
                ],
            });
        }
    },
};

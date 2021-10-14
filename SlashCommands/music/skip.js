const { Client, CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { getGuildSubscription } = require('../../utils/MusicCommands');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next song in the queue'),
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

        if (subscription) {
            // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
            // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
            // will be loaded and played.
            if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle) {
                return await interaction.followUp({
                    content: ':diamond_shape_with_a_dot_inside:  The queue is already ended',
                });
            }
            subscription.skip();
            await interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setDescription(':track_next: **Skipped song!**')
                        .setColor('#0070eb'),
                ],
            });
        } else {
            await interaction.followUp({
                content: ':diamond_shape_with_a_dot_inside:  Currently not playing in this server!',
            });
        }
    },
};

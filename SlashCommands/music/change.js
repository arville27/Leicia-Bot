const { Client, CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;

module.exports = {
    ...new SlashCommandBuilder()
        .setName('change')
        .setDescription('Change to any track in the queue')
        .addIntegerOption((option) =>
            option.setName('no').setDescription('Track number you want to play').setRequired(true)
        ),
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

        // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
        // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
        // will be loaded and played.
        const trackNumber = interaction.options.getInteger('no');
        if (trackNumber >= subscription.size || trackNumber < 1) {
            return await interaction.followUp({
                content: ':diamond_shape_with_a_dot_inside:  Please provide a valid number',
            });
        }

        subscription.changeTrack(trackNumber);
        await interaction.followUp({
            embeds: [
                new MessageEmbed()
                    .setDescription(`:track_next: **Change to track no ${trackNumber}!**`)
                    .setColor('#0070eb'),
            ],
        });
    },
};

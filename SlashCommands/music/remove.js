const { Client, CommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { response } = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove specific song on queue')
        .addIntegerOption((opt) =>
            opt.setName('no').setDescription('Track number on queue').setRequired(true)
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
                embeds: [response.notInVoiceChannel()],
            });
        }

        const subscription = getGuildSubscription(client, interaction);

        // if (!subscription) {
        //     return await interaction.followUp({
        //         embeds: [response.noSubscriptionAvailable()],
        //     });
        // }

        const trackNumber = interaction.options.getInteger('no');
        if (trackNumber > subscription.queue.length) {
            try {
                return await interaction.followUp({
                    embeds: [
                        new MessageEmbed().setDescription(
                            `Max: ${subscription.queue.length}, you provide ${trackNumber}`
                        ),
                    ],
                });
            } catch (error) {
                return await interaction.channel.send({
                    embeds: [
                        new MessageEmbed().setDescription(
                            `Max: ${subscription.queue.length}, you provide ${trackNumber}`
                        ),
                    ],
                });
            }
        } else if (trackNumber <= 0) {
            try {
                return await interaction.followUp({
                    embeds: [new MessageEmbed().setDescription(`You dumb`)],
                });
            } catch (error) {
                return await interaction.channel.send({
                    embeds: [new MessageEmbed().setDescription(`You dumb`)],
                });
            }
        }

        subscription.removeTrack(trackNumber);
        await interaction.followUp({
            embeds: [new MessageEmbed().setDescription(`Get: ${trackNumber}`)],
        });
    },
};

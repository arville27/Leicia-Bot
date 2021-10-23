const { Client, CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { response } = require('../../responses/MusicCommandsResponse');

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
                embeds: [response.notInVoiceChannel()],
            });
        }

        const subscription = getGuildSubscription(client, interaction);

        if (!subscription) {
            return await interaction.followUp({
                embeds: [response.noSubscriptionAvailable()],
            });
        }

        const trackNumber = interaction.options.getInteger('no');
        if (trackNumber > subscription.queue.length || trackNumber < 1) {
            return await interaction.followUp({
                embeds: [response.invalidTrackNumber()],
            });
        }

        subscription.changeTrack(trackNumber);
        await interaction.followUp({
            embeds: [response.successfulChangeTrack(trackNumber)],
        });
    },
};

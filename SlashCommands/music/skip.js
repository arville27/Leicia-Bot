const { Client, CommandInteraction, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { embedResponse } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

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
                embeds: [embedResponse(resp.others.notInVoiceChannel)],
            });
        }

        const subscription = getGuildSubscription(client, interaction);

        if (!subscription) {
            return await interaction.followUp({
                embeds: [embedResponse(resp.others.noSubscriptionAvailable)],
            });
        }

        if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle) {
            return await interaction.followUp({
                embeds: [embedResponse(resp.others.lastTrackInQueue)],
            });
        }

        subscription.skip();
        await interaction.followUp({
            embeds: [embedResponse(resp.others.successfulSkipTrack)],
        });
    },
};

const { Client, CommandInteraction, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { embedResponse, reply } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder().setName('dc').setDescription('Disconnect from the voice channel'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply();

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await reply(interaction, embedResponse(resp.others.notInVoiceChannel));
        }

        let subscription = getGuildSubscription(client, interaction);
        if (!subscription) {
            return await reply(interaction, embedResponse(resp.others.noSubscriptionAvailable));
        }

        subscription.voiceConnection.destroy();
        client.subscriptions.delete(interaction.guildId);
        await reply(interaction, embedResponse(resp.others.disconnectFromVoiceChannel));
    },
};

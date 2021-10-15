const { Client, CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { response } = require('../../responses/MusicCommandsResponse');

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
                embeds: [response.notInVoiceChannel()],
            });
        }

        let subscription = getGuildSubscription(client, interaction);
        if (!subscription) {
            return await interaction.followUp({
                embeds: [response.noSubscriptionAvailable()],
            });
        }

        subscription.voiceConnection.destroy();
        client.subscriptions.delete(interaction.guildId);
        await interaction.followUp({
            embeds: [response.disconnectFromVoiceChannel()],
        });
    },
};

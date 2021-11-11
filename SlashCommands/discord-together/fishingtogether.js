const { Client, CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { embedResponse } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('fishingtogether')
        .setDescription('Fishing with your friends!'),
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

        client.discordTogether
            .createTogetherCode(interaction.member.voice.channel.id, 'fishing')
            .then(async (invite) => {
                const embed = new MessageEmbed()
                    .setTitle('Fishing!')
                    .setTimestamp()
                    .setDescription(`**[Click here to join](${invite.code})**`);
                try {
                    await interaction.followUp({ embeds: [embed] });
                } catch (error) {
                    await interaction.channel.send({ embeds: [embed] });
                }
            });
    },
};

const { Client, CommandInteraction, MessageEmbed, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { embedResponse, reply } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder().setName('amogus').setDescription('Betray your friends!'),
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

        client.discordTogether
            .createTogetherCode(interaction.member.voice.channel.id, 'betrayal')
            .then(async (invite) => {
                const embed = new MessageEmbed()
                    .setTitle('Play betrayal')
                    .setTimestamp()
                    .setDescription(`**[Click here to join](${invite.code})**`);
                await reply(interaction, embed);
            });
    },
};

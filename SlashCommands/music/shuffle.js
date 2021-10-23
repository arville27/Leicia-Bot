const { Client, CommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder, bold } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { response } = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder().setName('shuffle').setDescription('Shuffles the queue'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: false });

        const subscription = getGuildSubscription(client, interaction);

        if (!subscription) {
            return await interaction.followUp({
                embeds: [response.noSubscriptionAvailable()],
            });
        } else if (subscription && subscription.queue.length == 0) {
            // subscription is created, by the queue is empty
            return await interaction.followUp({
                embeds: [response.queueIsEmpty()],
            });
        }

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await interaction.followUp({
                embeds: [response.notInVoiceChannel()],
            });
        }

        // this shuffle method will shuffle the queue every time it called
        subscription.shuffle();

        const embed = new MessageEmbed().setDescription(`Queue shuffled`);

        try {
            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            await interaction.channel.send({ embeds: [embed] });
        }
    },
};

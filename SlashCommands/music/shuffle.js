const { Client, CommandInteraction, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { embedResponse, reply } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder().setName('shuffle').setDescription('Shuffles the queue'),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply();

        const subscription = getGuildSubscription(client, interaction);

        if (!subscription) {
            return await reply(interaction, embedResponse(resp.others.noSubscriptionAvailable));
        } else if (subscription && subscription.queue.length == 0) {
            // subscription is created, by the queue is empty
            return await reply(interaction, embedResponse(resp.others.queueIsEmpty));
        }

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await reply(interaction, embedResponse(resp.others.notInVoiceChannel));
        }

        // this shuffle method will shuffle the queue every time it called
        subscription.shuffle();

        await reply(interaction, embedResponse(resp.others.queueShuffled));
    },
};

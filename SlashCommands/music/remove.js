const { Client, CommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder, bold, hyperlink } = require('@discordjs/builders');
const { getGuildSubscription } = require('../../utils/MusicCommands').mc;
const { embedResponse, reply } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');

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
        await interaction.deferReply();

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await reply(interaction, embedResponse(resp.others.notInVoiceChannel));
        }

        let subscription = getGuildSubscription(client, interaction);
        if (!subscription) {
            return await reply(interaction, embedResponse(resp.others.noSubscriptionAvailable));
        }

        const trackNumber = interaction.options.getInteger('no');
        if (trackNumber > subscription.queue.length) {
            const embed = new MessageEmbed()
                .setColor('#eb0000')
                .setDescription(
                    `${bold('Invalid track number')}\nNumbers of song in the queue (${
                        subscription.queue.length
                    }), you provide ${trackNumber}`
                );
            return await reply(interaction, embed);
        } else if (trackNumber <= 0) {
            const embed = new MessageEmbed()
                .setColor('#eb0000')
                .setDescription(
                    `${bold('Invalid track number')}\nTrack number must be more than 0`
                );
            return await reply(interaction, embed);
        }

        const track = subscription.queue.at(trackNumber - 1);

        subscription.removeTrack(trackNumber);

        const embed = new MessageEmbed()
            .setColor('#0070eb')
            .setDescription(`${bold('Successfully remove')} ${hyperlink(track.title, track.url)}`);
        await reply(interaction, embed);
    },
};

const { Client, CommandInteraction, GuildMember } = require('discord.js');
const { SlashCommandBuilder, bold } = require('@discordjs/builders');
const { entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { embedResponse } = require('../../utils/Utility');
const resp = require('../../responses/MusicCommandsResponse');
const { mc } = require('../../utils/MusicCommands');
const SavedPlaylist = require('../../models/SavedPlaylist');
const { Track } = require('../../structures/Track');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('addtoqueue')
        .setDescription("Add user's playlist to current queue")
        .addStringOption((input) =>
            input.setName('name').setDescription('Playlist name').setRequired(true)
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
            return await interaction.followUp({
                embeds: [embedResponse(resp.others.notInVoiceChannel)],
            });
        }

        let subscription = mc.getGuildSubscription(client, interaction);
        // If a connection to the guild doesn't already exist, join that channel
        // and create a subscription.
        if (!subscription) {
            subscription = mc.createSubscription(client, interaction);
        }

        // Make sure the connection is ready before processing the user's request
        try {
            await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
        } catch (error) {
            console.warn(error);
            return await interaction.followUp({
                embeds: [embedResponse(resp.others.failedJoinVoiceChannel)],
            });
        }

        const playlistName = interaction.options.getString('name');
        const query = { author: interaction.user.id, _id: playlistName };
        const playlist = await SavedPlaylist.findOne(query).catch(async (err) => {
            console.log(err);
            return await interaction.followUp({
                embeds: [
                    embedResponse({
                        msg: `${bold('Unknown error')}\nPlease try again later.`,
                        color: '#eb0000',
                    }),
                ],
            });
        });

        if (!playlist)
            return await interaction.followUp({
                embeds: [
                    embedResponse({
                        msg: bold('Invalid playlist name'),
                        color: '#eb0000',
                    }),
                ],
            });

        subscription.enqueue(
            playlist.tracks.map(
                (track) => new Track(track, mc.trackInfoMethods(subscription, interaction, track))
            )
        );

        await interaction.followUp({
            embeds: [
                resp.playlistEmbed(interaction, {
                    playlistName: playlist._id,
                    count: playlist.tracks.length,
                }),
            ],
        });
    },
};

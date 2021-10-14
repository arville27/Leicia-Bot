const { Client, CommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Track } = require('../../structures/Track');
const ytsr = require('ytsr');
const { parseTrack, whatIsIt } = require('../../utils/SpotifyTrack');
const { isValidUrl } = require('../../utils/Utility');
const { mc } = require('../../utils/MusicCommands');
const { response } = require('../../responses/MusicCommandsResponse');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from YouTube')
        .addStringOption((option) =>
            option
                .setName('source')
                .setDescription('This can be a URL of the song/playlist to play or a keyword')
                .setRequired(true)
        ),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        // check if already defferd by search command
        if (!interaction.deferred) await interaction.deferReply();

        try {
            const log = `[${interaction.guild.name}][${interaction.user.tag}] play ${args}`;
            console.log(log);
        } catch (error) {
            console.log('Error trying to print log message');
        }

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setDescription(
                            ':octagonal_sign: **Join a voice channel and then try that again!**'
                        )
                        .setColor('#eb0000'),
                ],
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
                embeds: [
                    new MessageEmbed()
                        .setDescription(
                            ':octagonal_sign: **Failed to join voice channel within 20 seconds, please try again later!**'
                        )
                        .setColor('#eb0000'),
                ],
            });
        }

        let param = args[0];
        let mediaInfo;
        const trackPlaylist = [];
        if (isValidUrl(param)) {
            if (mc.isUrl(['spotify'], param)) {
                const type = await whatIsIt(param);
                if (type.track) {
                    param = (await parseTrack(param)).url;
                    const track = await mc.TrackMetadataFromYTUrl(param);
                    const trackPosition = subscription.getCurrPosition();
                    trackPlaylist.push(
                        new Track(track, mc.trackInfoMethods(interaction, track, trackPosition))
                    );

                    mediaInfo = response.singleTrackEmbed(interaction, track, trackPosition);
                } else if (type.album) {
                    const { playlistInfo, trackList } = await mc.TrackMetadatafromSpotifyAlbum(
                        param
                    );

                    trackList.forEach((track) => {
                        trackPlaylist.push(
                            new Track(
                                track,
                                mc.trackInfoMethods(
                                    interaction,
                                    track,
                                    subscription.getCurrPosition()
                                )
                            )
                        );
                    });

                    mediaInfo = response.albumEmbed(interaction, playlistInfo);
                } else if (type.playlist) {
                    const { playlistInfo, trackList } = await mc.TrackMetadatafromSpotifyPlaylist(
                        param
                    );

                    trackList.forEach((track) => {
                        trackPlaylist.push(
                            new Track(
                                track,
                                mc.trackInfoMethods(
                                    interaction,
                                    track,
                                    subscription.getCurrPosition()
                                )
                            )
                        );
                    });

                    mediaInfo = response.playlistEmbed(interaction, playlistInfo);
                }
            } else if (mc.isUrl(['youtube'], param)) {
                if (mc.isYTPlaylist(param)) {
                    const { playlistInfo, trackList } = await mc.TrackMetadataFromYTPlaylist(param);

                    trackList.forEach((track) => {
                        trackPlaylist.push(
                            new Track(
                                track,
                                mc.trackInfoMethods(
                                    interaction,
                                    track,
                                    subscription.getCurrPosition()
                                )
                            )
                        );
                    });

                    mediaInfo = response.playlistEmbed(interaction, playlistInfo);
                } else {
                    const track = await mc.TrackMetadataFromYTUrl(param);
                    const trackPosition = subscription.getCurrPosition();
                    trackPlaylist.push(
                        new Track(track, mc.trackInfoMethods(interaction, track, trackPosition))
                    );

                    mediaInfo = response.singleTrackEmbed(interaction, track, trackPosition);
                }
            }
        } else {
            // keyword as query
            // find a relevant youtube url and set it to param
            const results = await ytsr(param);
            param = results.items.find((item) => item.type === 'video').url;
            const track = await mc.TrackMetadataFromYTUrl(param);
            const trackPosition = subscription.getCurrPosition();
            trackPlaylist.push(
                new Track(track, mc.trackInfoMethods(interaction, track, trackPosition))
            );

            mediaInfo = response.singleTrackEmbed(interaction, track, trackPosition);
        }

        if (trackPlaylist.length == 0) {
            const embed = response.failedCreateTrack();
            try {
                return await interaction.followUp({ embeds: [embed] });
            } catch (error) {
                return await interaction.channel.send({ embeds: [embed] });
            }
        }

        subscription.enqueue(trackPlaylist);
        try {
            await interaction.followUp({ embeds: [mediaInfo] });
        } catch (error) {
            await interaction.channel.send({ embeds: [mediaInfo] });
        }
    },
};

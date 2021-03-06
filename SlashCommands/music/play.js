const { Client, CommandInteraction, GuildMember } = require('discord.js');
const { SlashCommandBuilder, bold } = require('@discordjs/builders');
const { entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Track } = require('../../structures/Track');
const { parsePlaylist, parseAlbum, parseTrack, whatIsIt } = require('../../utils/SpotifyTrack');
const { parsePlaylistSub, parseAlbumSub, whatIsItSub } = require('../../utils/SubsonicTrack');
const { isValidUrl, isUrl, embedResponse, reply, stdLog } = require('../../utils/Utility');
const { mc } = require('../../utils/MusicCommands');
const resp = require('../../responses/MusicCommandsResponse');

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

        // check if user in voice channel
        if (interaction.member instanceof GuildMember && !interaction.member.voice.channel) {
            return await reply(interaction, embedResponse(resp.others.notInVoiceChannel));
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
            stdLog(2, { extra: "[play] Can't join to voice channel", err: error });
            return await reply(interaction, embedResponse(resp.others.failedJoinVoiceChannel));
        }

        let param = args[0];
        let mediaInfo;
        const trackPlaylist = [];
        if (isValidUrl(param)) {
            if (isUrl(['spotify'], param)) {
                const type = await whatIsIt(param);
                if (type.track) {
                    try {
                        const track = await parseTrack(param);
                        trackPlaylist.push(
                            new Track(track, mc.trackInfoMethods(subscription, interaction, track))
                        );

                        mediaInfo = resp.singleTrackEmbed(
                            interaction,
                            track,
                            subscription.queue.length + 1
                        );
                    } catch (error) {
                        stdLog(2, {
                            extra: '[play]',
                            err: error,
                        });
                    }
                } else if (type.album) {
                    try {
                        const { playlistInfo, trackList } = await parseAlbum(param);

                        trackList.forEach((track) => {
                            trackPlaylist.push(
                                new Track(
                                    track,
                                    mc.trackInfoMethods(subscription, interaction, track)
                                )
                            );
                        });

                        mediaInfo = resp.playlistEmbed(interaction, playlistInfo);
                    } catch (error) {
                        stdLog(2, {
                            extra: '[play]',
                            err: error,
                        });
                    }
                } else if (type.playlist) {
                    try {
                        const { playlistInfo, trackList } = await parsePlaylist(param);

                        trackList.forEach((track) => {
                            trackPlaylist.push(
                                new Track(
                                    track,
                                    mc.trackInfoMethods(subscription, interaction, track)
                                )
                            );
                        });

                        mediaInfo = resp.playlistEmbed(interaction, playlistInfo);
                    } catch (error) {
                        stdLog(2, {
                            extra: '[play]',
                            err: error,
                        });
                    }
                }
            } else if (isUrl(['youtube', 'youtu'], param)) {
                if (await mc.isYTPlaylist(param)) {
                    try {
                        const { playlistInfo, trackList } = await mc.TrackMetadataFromYTPlaylist(
                            param
                        );

                        trackList.forEach((track) => {
                            trackPlaylist.push(
                                new Track(
                                    track,
                                    mc.trackInfoMethods(subscription, interaction, track)
                                )
                            );
                        });

                        mediaInfo = resp.playlistEmbed(interaction, playlistInfo);
                    } catch (error) {
                        stdLog(2, {
                            extra: '[play]',
                            err: error,
                        });
                    }
                } else {
                    try {
                        const track = await mc.TrackMetadataFromYTUrl(param);
                        trackPlaylist.push(
                            new Track(track, mc.trackInfoMethods(subscription, interaction, track))
                        );

                        mediaInfo = resp.singleTrackEmbed(
                            interaction,
                            track,
                            subscription.queue.length + 1
                        );
                    } catch (error) {
                        stdLog(2, {
                            extra: '[play] Failed to add track',
                            err: error,
                        });
                        return await reply(
                            interaction,
                            embedResponse({
                                msg: bold(
                                    `:x: Failed to add track due to video unavailable or age restricted content`
                                ),
                                color: '#eb0000',
                            })
                        );
                    }
                }
            } else if (
                client.subsonic &&
                isUrl(new URL(client.subsonic.host).hostname.split('.'), param)
            ) {
                const { album, playlist } = whatIsItSub(param);
                if (playlist) {
                    try {
                        const { playlistInfo, trackList } = await parsePlaylistSub(
                            client.subsonic,
                            param
                        );

                        trackList.forEach((track) => {
                            trackPlaylist.push(
                                new Track(
                                    track,
                                    mc.trackInfoMethods(subscription, interaction, track)
                                )
                            );
                        });

                        mediaInfo = resp.playlistEmbed(interaction, playlistInfo);
                    } catch (error) {
                        stdLog(2, {
                            extra: '[play]',
                            err: error,
                        });
                    }
                } else if (album) {
                    try {
                        const { playlistInfo, trackList } = await parseAlbumSub(
                            client.subsonic,
                            param
                        );

                        trackList.forEach((track) => {
                            trackPlaylist.push(
                                new Track(
                                    track,
                                    mc.trackInfoMethods(subscription, interaction, track)
                                )
                            );
                        });

                        mediaInfo = resp.playlistEmbed(interaction, playlistInfo);
                    } catch (error) {
                        stdLog(2, {
                            extra: '[play]',
                            err: error,
                        });
                    }
                }
            }
        } else {
            try {
                // param as query
                // find a relevant youtube url and set it to param
                const track = await mc.trackMetadataFrom(param);
                trackPlaylist.push(
                    new Track(track, mc.trackInfoMethods(subscription, interaction, track))
                );

                mediaInfo = resp.singleTrackEmbed(
                    interaction,
                    track,
                    subscription.queue.length + 1
                );
            } catch (error) {
                stdLog(2, {
                    extra: '[play]',
                    err: error,
                });
            }
        }

        if (trackPlaylist.length == 0) {
            return await reply(interaction, embedResponse(resp.others.failedAddTrack));
        }

        subscription.enqueue(trackPlaylist);
        await reply(interaction, mediaInfo);
    },
};

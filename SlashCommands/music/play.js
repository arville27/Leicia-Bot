const { Client, CommandInteraction, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Track } = require('../../structures/Track');
const { parsePlaylist, parseAlbum, parseTrack, whatIsIt } = require('../../utils/SpotifyTrack');
const { isValidUrl, isUrl, embedResponse } = require('../../utils/Utility');
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

        try {
            const log = `[${interaction.guild.name}][${interaction.user.tag}] play ${args}`;
            console.log(log);
        } catch (error) {
            console.log('Error trying to print log message');
        }

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
                        console.log(error, '\n');
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
                        console.log(error, '\n');
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
                        console.log(error, '\n');
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
                        console.log(error, '\n');
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
                        console.log(error, '\n');
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
                console.log(error, '\n');
            }
        }

        if (trackPlaylist.length == 0) {
            const embed = resp.failedCreateTrack();
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

const { Client, CommandInteraction, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Track } = require('../../structures/Track');
const ytsr = require('ytsr');
const { parsePlaylist, parseAlbum, parseTrack, whatIsIt } = require('../../utils/SpotifyTrack');
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
                embeds: [response.notInVoiceChannel()],
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
                embeds: [response.failedJoinVoiceChannel()],
            });
        }

        let param = args[0];
        let mediaInfo;
        const trackPlaylist = [];
        if (isValidUrl(param)) {
            if (mc.isUrl(['spotify'], param)) {
                const type = await whatIsIt(param);
                if (type.track) {
                    try {
                        const track = await parseTrack(param);
                        const trackPosition = subscription.getCurrPosition();
                        trackPlaylist.push(
                            new Track(track, mc.trackInfoMethods(interaction, track, trackPosition))
                        );

                        mediaInfo = response.singleTrackEmbed(interaction, track, trackPosition);
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
                                    mc.trackInfoMethods(
                                        interaction,
                                        track,
                                        subscription.getCurrPosition()
                                    )
                                )
                            );
                        });

                        mediaInfo = response.albumEmbed(interaction, playlistInfo);
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
                                    mc.trackInfoMethods(
                                        interaction,
                                        track,
                                        subscription.getCurrPosition()
                                    )
                                )
                            );
                        });

                        mediaInfo = response.playlistEmbed(interaction, playlistInfo);
                    } catch (error) {
                        console.log(error, '\n');
                    }
                }
            } else if (mc.isUrl(['youtube'], param)) {
                if (mc.isYTPlaylist(param)) {
                    try {
                        const { playlistInfo, trackList } = await mc.TrackMetadataFromYTPlaylist(
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
                    } catch (error) {
                        console.log(error, '\n');
                    }
                } else {
                    try {
                        const track = await mc.TrackMetadataFromYTUrl(param);
                        const trackPosition = subscription.getCurrPosition();
                        trackPlaylist.push(
                            new Track(track, mc.trackInfoMethods(interaction, track, trackPosition))
                        );

                        mediaInfo = response.singleTrackEmbed(interaction, track, trackPosition);
                    } catch (error) {
                        console.log(error, '\n');
                    }
                }
            }
        } else {
            try {
                // keyword as query
                // find a relevant youtube url and set it to param
                const results = await ytsr(param);
                const relevantItem = results.items.find((item) => item.type === 'video');

                // if no item are relevant with user keyword, return no result found message
                if (!relevantItem) {
                    try {
                        return await interaction.followUp({ embeds: [response.noResultsFound()] });
                    } catch (error) {
                        return await interaction.channel.send({
                            embeds: [response.noResultsFound()],
                        });
                    }
                }

                const track = await mc.TrackMetadataFromYTUrl(relevantItem.url);
                const trackPosition = subscription.getCurrPosition();
                trackPlaylist.push(
                    new Track(track, mc.trackInfoMethods(interaction, track, trackPosition))
                );

                mediaInfo = response.singleTrackEmbed(interaction, track, trackPosition);
            } catch (error) {
                console.log(error, '\n');
            }
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

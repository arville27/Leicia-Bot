const { Client, CommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MusicSubscription } = require('../../structures/MusicSubscription');
const { entersState, joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const { Track } = require('../../structures/Track');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from YouTube')
        .addStringOption((option) =>
            option
                .setName('song')
                .setDescription('The URL of the song/playlist to play')
                .setRequired(true)
        ),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply();
        let subscription = client.subscriptions.get(interaction.guildId);
        const url = interaction.options.getString('song');

        // If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
        // and create a subscription.
        if (!subscription) {
            if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                const channel = interaction.member.voice.channel;
                subscription = new MusicSubscription(
                    joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                    })
                );
                subscription.voiceConnection.on('error', console.warn);
                client.subscriptions.set(interaction.guildId, subscription);
            }
        }

        // If there is no subscription, tell the user they need to join a channel.
        if (!subscription) {
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

        // Make sure the connection is ready before processing the user's request
        try {
            await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
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

        try {
            let mediaInfo = null;
            if (Track.isPlaylist(url)) {
                const { playlistInfo, trackList } = await Track.makeTrackList(url, {
                    onFinish() {
                        return interaction.followUp({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription(':musical_note: **Queue finished**')
                                    .setColor('#eb0000'),
                            ],
                        });
                    },
                    onError(error) {
                        console.warn(error);
                        interaction
                            .followUp({ content: `Error: ${error.message}`, ephemeral: true })
                            .catch(console.warn);
                    },
                });

                trackList.forEach((track) => {
                    track.setOnStart(() => {
                        const trackInfo = Track.generateTrackEmbed(track, interaction);
                        interaction.followUp({ embeds: [trackInfo] }).catch(console.warn);
                    });
                });

                // trackList.forEach((track) => subscription.enqueue(track));
                subscription.enqueueList(trackList);

                // Media info
                mediaInfo = new MessageEmbed()
                    .setColor('#c99fff')
                    .setTitle(playlistInfo.playlistName)
                    .setAuthor('Playlist added to queue', interaction.user.avatarURL())
                    .setThumbnail(playlistInfo.thumbnail)
                    .addFields({
                        name: 'Added to queue',
                        value: `${playlistInfo.count}`,
                    })
                    .setTimestamp();
            } else {
                // Attempt to create a Track from the user's video URL
                const track = await Track.from(url, {
                    onStart() {
                        const trackInfo = Track.generateTrackEmbed(track, interaction);
                        interaction.followUp({ embeds: [trackInfo] }).catch(console.warn);
                    },
                    onFinish() {
                        return interaction.followUp({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription(':musical_note: **Queue finished**')
                                    .setColor('#eb0000'),
                            ],
                        });
                    },
                    onError(error) {
                        console.warn(error);
                        interaction
                            .followUp({ content: `Error: ${error.message}`, ephemeral: true })
                            .catch(console.warn);
                    },
                });

                // Enqueue the track and reply a success message to the user
                subscription.enqueue(track);

                mediaInfo = new MessageEmbed()
                    .setColor('#c99fff')
                    .setTitle(track.title)
                    .setURL(track.url)
                    .setAuthor('Added to queue', interaction.user.avatarURL())
                    .setThumbnail(track.thumbnail)
                    .addFields(
                        {
                            name: 'Song Duration',
                            value: track.getTrackDuration(),
                            inline: true,
                        },
                        {
                            name: 'Queue Position',
                            value: `Track ${track.position}`,
                            inline: true,
                        }
                    )
                    .setTimestamp();
            }
            await interaction.followUp({ embeds: [mediaInfo] });
        } catch (error) {
            console.warn(error);
            await interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setDescription(
                            ':octagonal_sign: **Failed to play track, please try again later!**'
                        )
                        .setColor('#eb0000'),
                ],
            });
        }
    },
};

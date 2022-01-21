const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder, bold, inlineCode } = require('@discordjs/builders');
const resp = require('../../responses/MusicCommandsResponse');
const { embedResponse, reply } = require('../../utils/Utility');
const { mc } = require('../../utils/MusicCommands');
const SavedPlaylist = require('../../models/SavedPlaylist');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('savequeue')
        .setDescription('Save current queue to user playlist')
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

        // check if connected to db
        if (!client.isDatabaseConnected) {
            return await reply(interaction, embedResponse(resp.others.serverError));
        }

        const subscription = mc.getGuildSubscription(client, interaction);

        if (!subscription) {
            return await reply(interaction, embedResponse(resp.others.noSubscriptionAvailable));
        } else if (subscription && subscription.queue.length == 0) {
            // subscription is created, by the queue is empty
            return await reply(interaction, embedResponse(embedResponse(resp.others.queueIsEmpty)));
        }

        const playlistName = interaction.options.getString('name');
        const playlist = {
            _id: playlistName,
            author: interaction.user.id,
            tracks: subscription.queue.map((track) => track.getTrackMetadata()),
        };

        try {
            await SavedPlaylist.create(playlist);
        } catch (error) {
            if (error.code === 11000) {
                await SavedPlaylist.updateOne(
                    { _id: playlistName, author: interaction.user.id },
                    playlist
                );
                return await reply(
                    interaction,
                    embedResponse({
                        msg: bold(`Successfully update ${inlineCode(playlistName)} playlist`),
                        color: '#eb0000',
                    })
                );
            }
            return await reply(interaction, embedResponse(resp.others.generalError));
        }

        await reply(
            interaction,
            embedResponse({
                msg: `${bold('Successfully save playlist')} (${inlineCode(playlistName)})`,
                color: '#0070eb',
            })
        );
    },
};

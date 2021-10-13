const { Client, CommandInteraction } = require('discord.js');

/**
 *
 * @param {Client} client
 * @param {CommandInteraction} interaction
 */
const getGuildSubscription = (client, interaction) => {
    let subscription = client.subscriptions.get(interaction.guildId);

    // check if already destroyed but still in the subscriptions map
    if (subscription && subscription.destroyed) {
        client.subscriptions.delete(interaction.guildId);
        subscription = null;
    }
    return subscription;
};

module.exports = { getGuildSubscription };

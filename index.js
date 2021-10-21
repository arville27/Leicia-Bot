const { Client, Collection, Intents } = require('discord.js');
const { DiscordTogether } = require('discord-together');

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
});

module.exports = client;

// Global Variables
client.commands = new Collection();
client.slashCommands = new Collection();
client.config = require('./config.json');
client.subscriptions = new Map();
client.discordTogether = new DiscordTogether(client);

// Initializing the project
require('./handler')(client);

client.login(client.config.token);

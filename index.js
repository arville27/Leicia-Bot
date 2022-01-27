const { Client, Collection, Intents } = require('discord.js');
const { DiscordTogether } = require('discord-together');
const { HealthCheckServer } = require('./healthcheckserver');
const { stdLog } = require('./utils/Utility');
const { SubsonicAPI } = require('./utils/SubsonicAPI');

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

if (client.config.subsonicHost && client.config.subsonicUser && client.config.subsonicPassword)
    client.subsonic = new SubsonicAPI(
        client.config.subsonicHost,
        client.config.subsonicUser,
        client.config.subsonicPassword
    );
if (!client.config.token) return stdLog(2, { extra: 'Missing discord bot token' });
if (!client.config.guildsId) return stdLog(2, { extra: 'Please provide at least one guild id' });
if (Object.values(client.config.guildsId).length == 0)
    return stdLog(2, { extra: 'Check if guildId in config.json, ensure it is in correct format' });
if (!client.config.prefix) return stdLog(2, { extra: 'Please provide a chat command prefix' });
if (!client.config.spotifyClientID || !client.config.spotifyClientSecret)
    return stdLog(2, { extra: 'Please provide a Spotify ClientID and Client Secret' });
// Initializing the project
require('./handler')(client);

new HealthCheckServer(3090).start();

client.login(client.config.token);

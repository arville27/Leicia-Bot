const { bold } = require('@discordjs/builders');
const { Message, Client } = require('discord.js');
const { embedResponse, reply } = require('../../utils/Utility');

module.exports = {
    name: 'ping',
    aliases: ['p'],
    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        await reply(message, embedResponse({ color: '#59C2FF', msg: bold('Pong!') }));
    },
};

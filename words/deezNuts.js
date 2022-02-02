const { Message, Client } = require('discord.js');
const { stdLog } = require('../utils/Utility');

module.exports = {
    name: 'Deez -> Nuts',
    /**
     *
     * @param {Message} message
     */
    matcher: function (client, message) {
        return message.content.match(/d[e3]+z/i) !== null;
    },
    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message) => {
        try {
            return await message.reply('Nuts :peanuts:');
        } catch (error) {
            stdLog(2, { message: message, err: error });
        }
    },
};

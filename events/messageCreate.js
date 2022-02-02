const client = require('../index');
const { stdLog } = require('../utils/Utility');

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // custom word handler
    for (const word of client.words) {
        if (word.matcher(client, message)) {
            stdLog(0, { message: message, extra: `WordName: ${word.name}, ${message.content}` });
            await word.run(client, message);
        }
    }

    // text commands
    if (!message.content.toLowerCase().startsWith(client.config.prefix)) return;
    const [cmd, ...args] = message.content.slice(client.config.prefix.length).trim().split(' ');

    const command =
        client.commands.get(cmd.toLowerCase()) ||
        client.commands.find((c) => c.aliases?.includes(cmd.toLowerCase()));

    if (!command) return;
    stdLog(0, { message: message, extra: `CommandName: ${command.name}, ${message.content}` });
    await command.run(client, message, args);
});

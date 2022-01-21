const { MessageEmbed } = require('discord.js');
const client = require('../index');
const { isValidUrl, isUrl, embedResponse, stdLog } = require('../utils/Utility');
const { getPostData } = require('../utils/Facebook');
const { bold } = require('@discordjs/builders');

client.on('messageCreate', async (message) => {
    const firstWord = message.content.split()[0];
    if (!message.author.bot && isValidUrl(firstWord) && isUrl(['facebook', 'fb'], firstWord)) {
        const post = await getPostData(firstWord).catch((error) => {
            stdLog(2, { extra: 'FacebookScraper API failed to fetch data', err: error });
        });
        if (!post) {
            return await message.channel.send({
                embeds: [
                    embedResponse({ msg: bold('Failed to fetch post content'), color: '#eb0000' }),
                ],
            });
        }

        let embed = null;
        try {
            embed = new MessageEmbed()
                .setTitle(post.username)
                .setDescription(post.post_text)
                .setColor('#3B5998')
                .addFields(
                    { name: 'Likes :thumbsup:', value: `${post.likes}`, inline: true },
                    { name: 'Shares :mega:', value: `${post.shares}`, inline: true },
                    { name: 'Comments :speech_left:', value: `${post.comments}`, inline: true }
                );
        } catch (error) {
            stdLog(1, { extra: 'Facebook embed error', err: error });
        }

        if (post.user_url) embed.setURL(post.user_url);
        if (post.images.length > 0) embed.setImage(post.images[0]);
        if (post.timestamp) embed.setTimestamp(post.timestamp);
        else if (post.time) embed.setTimestamp(new Date(post.time).getTime());
        if (post.video) await message.channel.send(post.video);
        await message.channel.send({ embeds: [embed] });
    } else if (
        message.author.bot ||
        !message.guild ||
        !message.content.toLowerCase().startsWith(client.config.prefix)
    )
        return;

    const [cmd, ...args] = message.content.slice(client.config.prefix.length).trim().split(' ');

    const command =
        client.commands.get(cmd.toLowerCase()) ||
        client.commands.find((c) => c.aliases?.includes(cmd.toLowerCase()));

    if (!command) return;
    await command.run(client, message, args);
});

const { MessageEmbed, CommandInteraction, Message } = require('discord.js');

const urlRegex = /([a-z]+:\/\/)(?:([a-z0-9]+)\.)?([a-z0-9]+)\.([a-z]{2,})/;
/**
 *
 * @param {string} url
 */
function matchUrlGroups(url) {
    const groups = url.match(urlRegex);
    if (!groups) return [];
    return groups.slice(0);
}

/**
 *
 * @param {string} url
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * @param {String[]} domains
 * @param {String} url
 */
function isUrl(domains, url) {
    return matchUrlGroups(url).some((term) => {
        return domains.find((domain) => domain === term);
    });
}

/**
 *
 * @param {string} message Message to send
 * @param {string} color Color in hex
 */
function embedResponse({ msg, color }) {
    const embed = new MessageEmbed().setDescription(msg);
    if (color) embed.setColor(color);
    return embed;
}

/**
 *
 * @param {string} str String to truncate
 * @param {number} max Max length of the string before truncated
 * @returns
 */
function truncateString(str, max) {
    return `${str.slice(0, max)}${str.length > max ? '...' : ''}`;
}

/**
 *
 * @param {CommandInteraction} interaction
 * @param {MessageEmbed} embed
 */
async function reply(interaction, embed) {
    try {
        await interaction.followUp({ embeds: [embed] });
    } catch (error) {
        await interaction.channel.send({ embeds: [embed] });
    }
}

/**
 * @typedef {interaction: CommandInteraction, cmd: Object, args: Array, extra: Object, err: any} logArgs
 * @param {Number} level 0: INFO, 1: WARN, 2:ERROR
 * @param {logArgs} logArgs
 */
function stdLog(level, { interaction, cmd, args, extra, err }) {
    let logLevel = 'INFO';
    if (level && level === 1) logLevel = 'WARN';
    else if (level && level === 2) logLevel = 'ERROR';
    let logInformation = `[${new Date().toLocaleString()}][${logLevel}]`;

    if (interaction) {
        logInformation += `[${interaction.guild.name} :: ${interaction.user.tag}]`;
    } else {
        logInformation += '[SYSTEM]';
    }

    if (cmd) {
        logInformation += ` ${interaction.commandName}`;
        if (args) logInformation += ` ${args}`;
        if (!interaction.member.permissions.has(cmd.userPermissions || [])) {
            logInformation += ` (Insufficent user permission: ${cmd.userPermissions})`;
        }
    }

    if (extra) {
        logInformation += ` ${extra}`;
    }

    if (err) {
        logInformation += `\n${err}`;
    }

    console.log(logInformation);
}

module.exports = {
    matchUrlGroups,
    isValidUrl,
    isUrl,
    embedResponse,
    truncateString,
    reply,
    stdLog,
};

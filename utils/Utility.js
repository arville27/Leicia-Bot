const { MessageEmbed } = require('discord.js');

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
    const groups = url.match(urlRegex);
    return groups ? true : false;
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
    return `${str.substr(0, max)}${str.length > max ? '...' : ''}`;
}

module.exports = { matchUrlGroups, isValidUrl, isUrl, embedResponse, truncateString };

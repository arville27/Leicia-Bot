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

module.exports = { matchUrlGroups, isValidUrl };

const ln = require('./lyrics-src/ln');
const al = require('./lyrics-src/al');
const genius = require('./lyrics-src/genius');

// LN: Lyrical Nonsense
// AL: Animelyrics
const Provider = {
    LN: ln,
    AL: al,
    GENIUS: genius,
};

/**
 * @param {String} query keyword to find lyrics
 * @param {Object[]} Provider
 */
const searchLyrics = async (query, Provider) => {
    let results = [];
    for (const prov of Provider) {
        results = results.concat(await prov.getResults(query));
    }
    return results;
};

module.exports = { Provider, searchLyrics };

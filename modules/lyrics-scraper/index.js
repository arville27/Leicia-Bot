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
        const indivProvRes = await prov.getResults(query);
        results = results.concat(indivProvRes);
    }
    if (results.length == 0) throw 'No lyrics found';
    return results;
};

module.exports = { Provider, searchLyrics };

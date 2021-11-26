const axios = require('axios').default;
const cheerio = require('cheerio');

/**
 * @param {string} url - Genius URL
 */
const extractLyrics = async (url) => {
    let { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let lyrics = $('div[class="lyrics"]').text().trim();
    if (!lyrics) {
        lyrics = '';
        $('div[class^="Lyrics__Container"]').each((i, elem) => {
            if ($(elem).text().length !== 0) {
                let snippet = $(elem)
                    .html()
                    .replace(/<br>/g, '\n')
                    .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, '');
                lyrics += $('<textarea/>').html(snippet).text().trim() + '\n\n';
            }
        });
    }
    if (!lyrics) return null;
    return lyrics.trim();
};

/**
 *
 * @param {string} apiKey
 * @param {string} query
 * @param {number} count
 */
const getResults = async (query, count = 3) => {
    const apiKey = 'h2VsUfA5XIqiB_54ig7o8kb6kVIP9GadBiV3VYhWELibaG8mRJn3P5kfVWZjfkXl';
    const searchUrl = 'https://api.genius.com/search?q=';
    const reqUrl = `${searchUrl}${encodeURIComponent(query)}`;
    let { data } = await axios.get(`${reqUrl}&access_token=${apiKey}`);
    if (data.response.hits.length === 0) return [];
    const results = data.response.hits.slice(0, count).map((val) => {
        const { full_title, url, primary_artist } = val.result;
        return {
            artist: full_title.slice(0, full_title.search(/\sBy\s/i)),
            title: primary_artist.name,
            lyrics: extractLyrics(url),
            src: url,
            provider: 'Genius',
        };
    });

    return results;
};

module.exports = { getResults };

const axios = require('axios').default;
const cheerio = require('cheerio');
const { getSources, extractUrl } = require('../lib/cse');

const extractLyrics = async (url) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const lyrics = [];
        $('div[id="Romaji"]')
            .find('.olyrictext')
            .children()
            .each((_, el) => {
                lyrics.push(
                    $(el)
                        .html()
                        .replace(/\s?<br>\s?/g, '\n')
                );
            });
        return lyrics.join('\n');
    } catch (error) {
        console.log('extractLyricsMethod', error);
    }
};

const extractInfo = (url) => {
    const info = url
        .slice(0, -1)
        .split('/')
        .slice(-2)
        .map((x) => x.replace(/[-]/g, ' ').toUpperCase());
    return {
        artist: info[0].trim(),
        title: info[1].trim(),
    };
};

const isValidLyric = (url) => {
    // url: BASE/global/artist/title
    // Based on this structure, valid lyric url is defined
    const BASE = 'https://www.lyrical-nonsense.com/';
    return url.slice(BASE.length, -1).split('/').length < 4 ? false : true;
};

const getResults = async (query) => {
    const CSE_ID = '5ddc5d24693849251';
    const srcs = await getSources(query, CSE_ID);
    try {
        const results = srcs
            .map((src) => extractUrl(src))
            .filter((url) => isValidLyric(url))
            .map((url) => {
                console.log(url);
                return {
                    ...extractInfo(url),
                    lyrics: extractLyrics(url),
                    src: url,
                    provider: 'LyricalNonsense',
                };
            });
        return results;
    } catch (error) {
        return [];
    }
};

module.exports = {
    getResults,
};

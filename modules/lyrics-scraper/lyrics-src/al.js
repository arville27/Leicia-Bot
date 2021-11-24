const axios = require('axios').default;
const cheerio = require('cheerio');
const { getSources, extractUrl } = require('../lib/cse');

const extractLyrics = (src, lang = 'jp') => {
    let lyricType = 'romaji';
    if (lang === 'en') lyricType = 'translation';
    let lyrics = '';
    const center_box = src('.centerbox');
    const lyrTable = center_box.find('table');
    if (!lyrTable.length) {
        const $lyrics = center_box.find('span[class="lyrics"]');
        $lyrics.find('dt', 'sup').remove();
        lyrics = $lyrics.text();
        if (!lyrics.length) {
            let startInsert = false;
            center_box
                .children()
                .filter((_, el) => {
                    if (el.name === 'dt') startInsert = true;
                    if (startInsert && el.name === 'br') return true;
                    return false;
                })
                .each((i, el) => {
                    if (i == 0 && el.prev.type === 'text')
                        lyrics += el.prev.data.replace(/((\b\s+\b)|(\b\xa0+\b))/g, ' ');
                    if (el.next.type === 'text')
                        lyrics += el.next.data.replace(/((\b\s+\b)|(\b\xa0+\b))/g, ' ');
                });
        }
    } else {
        const langSpecific = lyrTable.find(`td[class="${lyricType}"]`).find('span');
        langSpecific.find('dt', 'sup').remove();
        langSpecific.each((_, el) =>
            el.children.forEach((x) => {
                if (x.next && x.name === 'br' && x.next.name === 'br') lyrics += '\n\n';
                else if (x.type === 'text')
                    lyrics += x.data.replace(/((\b\s+\b)|(\b\xa0+\b))/g, ' ');
            })
        );
    }
    return lyrics.trim();
};

const extractInfo = ($) => {
    const info = $('ul[id="crumbs"]').children().slice(-2);
    return {
        artist: info.first().text().trim(),
        title: info.last().text().trim(),
    };
};

const getResults = async (query) => {
    const CSE_ID = 'partner-pub-9427451883938449%3Agd93bg-c1sx';
    const srcs = await getSources(query, CSE_ID);
    const pages = srcs
        .map((src) => extractUrl(src))
        .map(async (url) => {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            return { $, url };
        });

    const results = await Promise.all(pages);

    return results
        .filter((x) => {
            const { url } = x;
            if (url.endsWith('htm') || url.endsWith('txt') || url.endsWith('html')) return true;
            return false;
        })
        .map((x) => {
            const { $, url } = x;
            return {
                ...extractInfo($),
                lyrics: extractLyrics($),
                src: url,
                provider: 'AnimeLyrics',
            };
        });
};

module.exports = {
    getResults,
};

const axios = require('axios').default;
const { FacebookScrapperAPIKey } = require('../config.json');

async function getPostData(url) {
    const PAYLOAD = {
        params: { url: url },
        headers: { 'X-API-Key': FacebookScrapperAPIKey },
    };
    const BASE_URL = 'http://api.arv.cx/fb/';
    const { data } = await axios.get(BASE_URL, PAYLOAD);
    return data;
}

module.exports = { getPostData };

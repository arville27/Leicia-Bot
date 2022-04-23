const axios = require('axios').default;
const { FacebookScrapperAPIKey } = require('../index').config;

async function getPostData(url) {
    const PAYLOAD = {
        params: { url: url },
        headers: { 'X-API-Key': FacebookScrapperAPIKey },
    };
    const BASE_URL = 'http://api.arv.cx/fb/';
    const { data } = await axios.get(BASE_URL, PAYLOAD);
    if (data.status == 204) return null;
    return data.data;
}

module.exports = { getPostData };

const axios = require('axios').default;
const { isValidUrl, stdLog } = require('../utils/Utility');
const crypto = require('crypto');

const SUBSONIC_API_VERSION = '1.1610';

class SubsonicAPI {
    constructor(subsonicHost, subsonicUser, subsonicPassword, version = SUBSONIC_API_VERSION) {
        this.host = this.validateHost(subsonicHost);
        this.base = this.host + '/rest';
        this.user = subsonicUser;
        this.pass = subsonicPassword;
        this.ver = version;
        this.queryParams = {
            u: this.user,
            v: this.ver,
            c: 'Leicia-Bot',
            f: 'json',
        };
    }

    /**
     *
     * @param {String} host SubsonicAPI host
     * @returns Sanitized host
     */
    validateHost(host) {
        if (!isValidUrl(host)) throw Error('Please provide a valid subsonic host');
        return host.endsWith('/') ? host.slice(0, host.length - 1) : host;
    }

    /**
     *
     * @returns Query parameter object containing token and salt
     */
    generateToken() {
        const salt = crypto.randomBytes(4).toString('hex');
        return {
            s: salt,
            t: this.md5(this.pass + salt),
        };
    }

    async pingServer() {
        return this.apiCall('ping');
    }

    /**
     *
     * @param {String} id Subsonic PlaylistID
     */
    async getPlaylist(id) {
        return this.apiCall('getPlaylist', { id: id });
    }

    /**
     *
     * @param {String} id Subsonic AlbumID
     */
    async getAlbum(id) {
        return this.apiCall('getAlbum', { id: id });
    }

    /**
     *
     * @param {String} string
     * @returns MD5 Hash hex encoded string
     */
    md5(string) {
        return crypto.createHash('md5').update(string).digest('hex');
    }

    /**
     *
     * @param {string} endpoint SubsonicAPI Endpoint
     * @param {Object} extraParam Extra query parameter
     */
    async apiCall(endpoint, extraParam = {}) {
        try {
            const { data } = await axios.get(this.base + '/' + endpoint, {
                params: {
                    ...this.queryParams,
                    ...this.generateToken(),
                    ...extraParam,
                },
            });
            const result = data['subsonic-response'];

            if (result.status != 'ok')
                throw Error(`\nCode: ${result.error.code}\nMessage: ${result.error.message}`);
            return data['subsonic-response'];
        } catch (error) {
            stdLog(2, {
                extra: '[SubsonicAPI] Error while sending request to the server',
                err: error,
            });
        }
    }
}

module.exports = { SubsonicAPI };

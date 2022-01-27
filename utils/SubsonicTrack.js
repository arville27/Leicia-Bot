const { TrackMetadata } = require('../structures/TrackMetadata');
const { trackMetadataFrom } = require('./MusicCommands').mc;
const { SubsonicAPI } = require('./SubsonicAPI');

/**
 *
 * @param {SubsonicAPI} subsonic
 * @param {String} url
 * @returns {TrackMetadata[]}
 */
async function parsePlaylistSub(subsonic, url) {
    const playlistUrl = new URL(url);
    const path = playlistUrl.pathname;
    const hash = playlistUrl.hash.split('/');
    if (!path.includes('app') || !hash.includes('playlist')) {
        throw Error('Unsupported type of url');
    }
    const playlistId = hash.at(hash.findIndex((str) => str === 'playlist') + 1);
    const playlist = (await subsonic.getPlaylist(playlistId)).playlist;

    const trackInfos = playlist.entry.map((item) => {
        const title = item.title;
        const artists = item.artists;
        return `${title} ${artists}`;
    });

    const tracksMetadata = trackInfos.map((query) => trackMetadataFrom(query, false));
    return {
        playlistInfo: {
            playlistName: playlist.name,
            count: tracksMetadata.length,
            thumbnail: null,
        },
        trackList: await Promise.all(tracksMetadata),
    };
}

module.exports = { parsePlaylistSub };

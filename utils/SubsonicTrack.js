const { TrackMetadata } = require('../structures/TrackMetadata');
const { trackMetadataFrom } = require('./MusicCommands').mc;
const { SubsonicAPI } = require('./SubsonicAPI');

function isPlaylistSub(url) {
    const playlistUrl = new URL(url);
    const path = playlistUrl.pathname;
    const hash = playlistUrl.hash.split('/');
    if (!path.includes('app') || !hash.includes('playlist')) return false;
    return true;
}

function isAlbumSub(url) {
    const albumUrl = new URL(url);
    const path = albumUrl.pathname;
    const hash = albumUrl.hash.split('/');
    if (!path.includes('app') || !hash.includes('album')) return false;
    return true;
}

function whatIsItSub(url) {
    return {
        album: isAlbumSub(url),
        playlist: isPlaylistSub(url),
    };
}

/**
 *
 * @param {SubsonicAPI} subsonic
 * @param {String} url
 * @returns {Promise<TrackMetadata[]>}
 */
async function parsePlaylistSub(subsonic, url) {
    if (!isPlaylistSub(url)) {
        throw Error('Not a valid subsonic playlist url');
    }
    const hash = new URL(url).hash.split('/');
    const playlistId = hash.at(hash.findIndex((str) => str === 'playlist') + 1);
    const playlist = (await subsonic.getPlaylist(playlistId)).playlist;

    const trackInfos = playlist.entry.map((item) => {
        const title = item.title;
        const artist = item.artist;
        return `${title} ${artist}`;
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

/**
 *
 * @param {SubsonicAPI} subsonic
 * @param {String} url
 * @returns {Promise<TrackMetadata[]>}
 */
async function parseAlbumSub(subsonic, url) {
    if (!isAlbumSub(url)) {
        throw Error('Not a valid subsonic album url');
    }
    const hash = new URL(url).hash.split('/');
    const albumId = hash.at(hash.findIndex((str) => str === 'album') + 1);
    const album = (await subsonic.getAlbum(albumId)).album;

    const trackInfos = album.song.map((item) => {
        const title = item.title;
        const artist = item.artist;
        return `${title} ${artist}`;
    });

    const tracksMetadata = trackInfos.map((query) => trackMetadataFrom(query, false));
    return {
        playlistInfo: {
            playlistName: album.name,
            count: tracksMetadata.length,
            thumbnail: null,
        },
        trackList: await Promise.all(tracksMetadata),
    };
}

module.exports = { parsePlaylistSub, parseAlbumSub, isAlbumSub, isPlaylistSub, whatIsItSub };

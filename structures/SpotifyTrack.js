const ytsr = require('ytsr');
const { spotifyClientID, spotifyClientSecret } = require('../config.json');
const { Spotify } = require('spotify-info.js');
const spotify = new Spotify({
    clientID: spotifyClientID,
    clientSecret: spotifyClientSecret,
});

const isTrack = async (url) => {
    try {
        await spotify.getTrackByURL(url);
    } catch (err) {
        return false;
    }
    return true;
};

const isPlaylist = async (url) => {
    try {
        await spotify.getPlaylistByURL(url);
    } catch (err) {
        return false;
    }
    return true;
};

const isAlbum = async (url) => {
    try {
        await spotify.getAlbumByURL(url);
    } catch (err) {
        return false;
    }
    return true;
};

const whatIsIt = async (url) => {
    return {
        track: await isTrack(url),
        album: await isAlbum(url),
        playlist: await isPlaylist(url),
    };
};

const parsePlaylist = async (url) => {
    const playlist = await spotify.getPlaylistByURL(url);
    const urls = Promise.all(
        playlist.tracks.items.map(async (item) => {
            const title = item.track.name;
            const artists = item.track.artists.map((artist) => artist.name).join(' ');
            const results = await ytsr(`${title} ${artists}`);
            return results.items.find((i) => i.type === 'video').url;
        })
    );
    return {
        playlistName: playlist.name,
        playlistOwner: playlist.owner.display_name,
        items: await urls,
    };
};

const parseAlbum = async (url) => {
    const album = await spotify.getAlbumByURL(url);
    const artists = album.artists.map((artist) => artist.name);
    const urls = Promise.all(
        album.tracks.items.map(async (item) => {
            const title = item.name;
            const results = await ytsr(`${title} ${artists.join(' ')}`);
            return results.items.find((i) => i.type === 'video').url;
        })
    );
    return {
        albumName: album.name,
        artists: artists,
        items: await urls,
    };
};

const parseTrack = async (url) => {
    const track = await spotify.getTrackByURL(url);
    return {
        title: track.name,
        url: await ytsr(track.name).then(
            (results) => results.items.find((item) => item.type == 'video').url
        ),
    };
};

module.exports = { isTrack, isAlbum, isPlaylist, whatIsIt, parsePlaylist, parseAlbum, parseTrack };

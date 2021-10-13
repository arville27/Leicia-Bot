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
    const trackInfos = playlist.tracks.items.map((item) => {
        const title = item.track.name;
        const artists = item.track.artists.map((artist) => artist.name).join(' ');
        return `${title} ${artists}`;
    });

    const getRelevantResult = async (query) => {
        return await ytsr(query).then(
            (results) => results.items.find((i) => i.type === 'video').url
        );
    };

    const urls = trackInfos.map(async (info) => await getRelevantResult(info));
    return {
        playlistName: playlist.name,
        playlistOwner: playlist.owner.display_name,
        items: await Promise.all(urls),
    };
};

const parseAlbum = async (url) => {
    const album = await spotify.getAlbumByURL(url);
    const artists = album.artists.map((artist) => artist.name);
    const trackInfos = album.tracks.items.map((item) => {
        const title = item.name;
        return `${title} ${artists}`;
    });

    const getRelevantResult = async (query) => {
        return await ytsr(query).then(
            (results) => results.items.find((i) => i.type === 'video').url
        );
    };
    const urls = trackInfos.map(async (info) => await getRelevantResult(info));
    return {
        albumName: album.name,
        artists: artists,
        items: await Promise.all(urls),
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

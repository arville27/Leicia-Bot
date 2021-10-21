const ytsr = require('ytsr');
const { spotifyClientID, spotifyClientSecret } = require('../config.json');
const { Spotify } = require('spotify-info.js');
const { TrackMetadata } = require('../structures/TrackMetadata');
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

const trackMetadataFrom = async (query) => {
    const parseDuration = (duration) => {
        const timePart = duration.split(':').map((x) => parseInt(x));
        let length = 0;
        if (timePart.length == 1) {
            length += timePart[0];
        } else if (timePart.length == 2) {
            const [minute, second] = timePart;
            length += minute * 60 + second;
        } else if (timePart.length == 3) {
            const [hour, minute, second] = timePart;
            length += hour * 3600 + minute * 60 + second;
        }
        return length;
    };

    const res = await ytsr(query);
    const info = res.items.find((item) => item.type === 'video');
    return new TrackMetadata({
        title: info.title,
        url: info.url,
        thumbnail: info.bestThumbnail.url,
        length: parseDuration(info.duration),
    });
};

const parsePlaylist = async (url) => {
    const playlist = await spotify.getPlaylistByURL(url);
    const trackInfos = playlist.tracks.items.map((item) => {
        const title = item.track.name;
        const artists = item.track.artists.map((artist) => artist.name).join(' ');
        return `${title} ${artists}`;
    });

    const tracksMetadata = trackInfos.map((query) => trackMetadataFrom(query));
    return {
        playlistInfo: {
            playlistName: playlist.name,
            count: tracksMetadata.length,
            thumbnail: null,
        },
        trackList: await Promise.all(tracksMetadata),
    };
};

const parseAlbum = async (url) => {
    const album = await spotify.getAlbumByURL(url);
    const artists = album.artists.map((artist) => artist.name);
    const trackInfos = album.tracks.items.map((item) => {
        const title = item.name;
        return `${title} ${artists}`;
    });

    const tracksMetadata = trackInfos.map((query) => trackMetadataFrom(query));
    return {
        playlistInfo: {
            playlistName: `${artists} - ${album.name}`,
            count: tracksMetadata.length,
            thumbnail: null,
        },
        trackList: await Promise.all(tracksMetadata),
    };
};

const parseTrack = async (url) => {
    const track = await spotify.getTrackByURL(url);
    return trackMetadataFrom(track.name);
};

module.exports = { isTrack, isAlbum, isPlaylist, whatIsIt, parsePlaylist, parseAlbum, parseTrack };

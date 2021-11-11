const mongoose = require('mongoose');

const TrackSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    length: {
        type: String,
        required: true,
    },
});

const PlaylistSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    tracks: {
        type: [TrackSchema],
        required: true,
    },
});

const SavedPlaylist = mongoose.model('SavedPlaylist', PlaylistSchema);

module.exports = SavedPlaylist;

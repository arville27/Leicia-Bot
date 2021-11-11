class TrackMetadata {
    /**
     *
     * @param {String} title Track title
     * @param {String} url Track Youtube URL
     * @param {String} thumbnail Thumbnail URL
     * @param {Number} length Track length in seconds
     */
    constructor({ title, url, thumbnail, length }) {
        this.title = title;
        this.url = url;
        this.thumbnail = thumbnail;
        this.length = length;
    }
}

module.exports = { TrackMetadata };

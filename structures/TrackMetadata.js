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
        this.duration = {
            hour: `${Math.floor(length / 3600)}`.padStart(2, 0),
            minute: `${Math.floor((length / 60) % 60)}`.padStart(2, 0),
            second: `${length % 60}`.padStart(2, 0),
        };
    }

    getTrackDuration() {
        if (parseInt(this.duration.hour) > 0)
            return `${this.duration.hour}:${this.duration.minute}:${this.duration.second}`;
        return `${this.duration.minute}:${this.duration.second}`;
    }
}

module.exports = { TrackMetadata };

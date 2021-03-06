/**
 * Serializable class that represent Track for storage purposes
 */

class TrackMetadata {
    /**
     *
     * @param {String} title Track title
     * @param {String} url Track Youtube URL
     * @param {String} thumbnail Thumbnail URL
     * @param {Number} length Track length in seconds
     */
    constructor({ title, url, thumbnail, length, isLive }) {
        this.title = title;
        this.url = url;
        this.thumbnail = thumbnail;
        this.length = TrackMetadata.getTrackDuration(length);
        this.isLive = isLive;
    }

    static getTrackDuration(length) {
        if (length === 0) return 'Live stream';
        const duration = {
            hour: `${Math.floor(length / 3600)}`.padStart(2, 0),
            minute: `${Math.floor((length / 60) % 60)}`.padStart(2, 0),
            second: `${length % 60}`.padStart(2, 0),
        };
        if (parseInt(duration.hour) > 0)
            return `${duration.hour}:${duration.minute}:${duration.second}`;
        return `${duration.minute}:${duration.second}`;
    }
}

module.exports = { TrackMetadata };

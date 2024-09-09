const { piped_instances } = require('./config.json');
const axios = require('axios');
let current_instance = piped_instances[0] ?? 'https://pipedapi.kavin.rocks';

/**
 * Represents the search result of a media item.
 *
 * @typedef {Object} SearchResult
 * @property {string} url - The URL of the media item.
 * @property {string} type - The type of the media item.
 * @property {string} title - The title of the media item.
 * @property {string} thumbnail - The URL of the thumbnail image of the media item.
 * @property {string} uploaderName - The name of the uploader of the media item.
 * @property {string} uploaderUrl - The URL of the uploader's profile.
 * @property {string} uploaderAvatar - The URL of the uploader's avatar image.
 * @property {string} uploadedDate - The date when the media item was uploaded.
 * @property {string} shortDescription - A short description of the media item.
 * @property {number} duration - The duration of the media item in seconds.
 * @property {number} views - The number of views of the media item.
 * @property {number} uploaded - The timestamp when the media item was uploaded.
 * @property {boolean} uploaderVerified - Indicates whether the uploader is verified.
 * @property {boolean} isShort - Indicates whether the media item is short.
*/

async function rotateReqUntilSuccess(url) {
    let currentInstanceIndex = piped_instances.indexOf(current_instance);

    for (let i = 0; i < piped_instances.length; i++) {
        try {
            console.log(`🔗 Requesting ${url} from ${piped_instances[currentInstanceIndex]}...`);
            const res = await axios.get(`${piped_instances[currentInstanceIndex]}${url}`);
            current_instance = piped_instances[currentInstanceIndex];
            return res;
        } catch (e) {
            console.error(`❌ ${piped_instances[currentInstanceIndex]} failed with error: ${e.message}`);
            currentInstanceIndex = (currentInstanceIndex + 1) % piped_instances.length;

            // If all instances failed, throw the error
            if (i === piped_instances.length - 1) {
                throw new Error('[rotateReqUntilSuccess] All instances failed\nIf you are seeing this, please wait for a while and try again later.');
            }
        }
    }
}

/**
 * Searches for media items. (/search?q=:query&filter=:filter)
 * @param {string} query 
 * @param {string?} filter
 * @returns {Promise<SearchResult[]>}
*/
async function search(query, filter = 'videos') {
    // Strip the URL to a query if it is a YouTube video URL (oh and also remove the si parameter)
    if (query.match(/^(https?:\/\/)?(www\.|music.)?(youtube\.com)\/watch/gmi)) {
        const url = new URL(query);

        return [
            {
                url: `/watch?v=${url.searchParams.get('v')}`,
                title: 'Linked video',
                shortDescription: 'This video was linked directly so we don\'t really have a description for it.',
                thumbnail: `https://1.1.1.1/fail.jpg`, // Just bother cloudflare with a 404 image :D
                // Rest should be fetched alongside the stream
            }
        ]; // Well we already have the URL, so why not just return it?
    }

    if (query.match(/^(https?:\/\/)?(www\.|music.)?(youtube\.com)\/playlist/gmi)) {
        throw new Error('Playlists are not supported yet.'); // Picked up by the catch block in index.js
    }

    const res = await rotateReqUntilSuccess(`/search?q=${encodeURIComponent(query)}&filter=${filter}`);
    return res.data.items;
}

/**
 * Gets the streams of a media item. (/streams/:id)
 * 
 * @param {string} id
 * @returns {Promise<any>}
*/
async function getStreams(id) {
    const res = await rotateReqUntilSuccess(`/streams/${id}`);
    const streams = res.data;
    return streams;
}

module.exports = {
    search,
    getStreams
}
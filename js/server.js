// Audioshield-PlayMusic

// Required libraries
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const PlayMusic = require('playmusic');
const ffmpeg = require('fluent-ffmpeg');
const http = require('http');
const express = require('express');
const run = require('gen-run');
const ini = require('ini');
const Fuse = require('fuse.js');
const FUSE_OPTIONS = {
	keys: [{
		name: 'title',
		weight: 0.4
	}, {
		name: 'album',
		weight: 0.2
	}, {
		name: 'artist',
		weight: 0.2
	}, {
		name: 'albumArtist',
		weight: 0.2
	}]
};

// config
const DIR = path.join(__dirname, '..');
const CONFIG = ini.parse(fs.readFileSync(path.join(DIR, 'config.ini'), 'utf-8'));

// Load the credentails
const API_KEY = require(path.join(DIR, 'api/apikey.json'));

// Load a template for an empty response from Soundcloud API. This will be filled with values from the Play Music API.
const searchTemplate = require(path.join(DIR, 'api/youtube-search-template.json'));
const resultTemplate = require(path.join(DIR, 'api/youtube-search-result-template.json'));
const youtubeTemplate = require(path.join(DIR, 'api/youtube-template.json'));
const videoTemplate = require(path.join(DIR, 'api/youtube-video-template.json'));

var app = express();
var pm = new PlayMusic();

// Cached items
var CACHED_LIBRARY;
var CACHED_PLAYLIST_NAMES;
var CACHED_PLAYLIST_TRACKS;
var CACHED_FAVORITES;
var CACHED_VIDEOS = {};

var parseQuery = function(q) {
	q = q && q.trim();
	if (!q || q === '-') return {};
	if (q.charAt(0) !== '-') return { q: q };

	var indexOfSpace = q.indexOf(' ');
	var cmd;
	if (indexOfSpace < 0) {
		cmd = q.slice(1);
	} else {
		cmd = q.slice(1, indexOfSpace);
	}
	cmd = cmd.toLowerCase();

	var qOptional = false;
	if (CMD[cmd] && CMD[cmd].qOptional) {
		qOptional = true;
	}

	return { cmd: cmd, q: (indexOfSpace < 0) ? null : q.slice(indexOfSpace + 1), qOptional: qOptional };
};

var parseSearch = function(tracks) {
	var output = JSON.parse(JSON.stringify(searchTemplate));
	output.pageInfo.totalResults = output.pageInfo.resultsPerPage = tracks.length;
	output.items = tracks.map((track) => {
		var video = JSON.parse(JSON.stringify(resultTemplate));
		video.id.videoId = `*${track.nid}`;
		video.snippet.title = track.title;
		video.snippet.channelTitle = track.artist;
		for (var property in video.snippet.thumbnails) {
			video.snippet.thumbnails[property].url = track.albumArtRef[0].url;
		}
		return video;
	});

	// Return the constructed output in JSON-format
	return JSON.stringify(output);
};

var parseVideos = function(tracks) {
	var output = JSON.parse(JSON.stringify(youtubeTemplate));
	output.pageInfo.totalResults = output.pageInfo.resultsPerPage = tracks.length;
	output.items = tracks.map((track) => {
		var video = JSON.parse(JSON.stringify(videoTemplate));
		video.id = `*${track.nid}`;
		video.snippet.title = video.snippet.localized.title = track.title;
		video.snippet.channelTitle = track.artist;
		for (var property in video.snippet.thumbnails) {
			video.snippet.thumbnails[property].url = track.albumArtRef[0].url;
		}
		return video;
	});

	// Return the constructed output in JSON-format
	return JSON.stringify(output);
};

var getMusic = function(q, entryType, callback) {
	pm.search(q, 50, (err, data) => {
		if (err) return callback(err);
		if (!data.entries) return callback(null, []);

		var entries = data.entries.filter((entry) => {
			return entry.type === entryType;
		});

		callback(null, entries);
	});
};

var getTracks = function(q, callback) {
	getMusic(q, '1', (err, data) => {
		if (err) return callback(err);
		callback(null, data.map((track) => {
			return track.track;
		}));
	});
};

var getAlbumTracks = function(q, callback) {
	run(function*(gen) {
		try {
			var albums = yield getMusic(q, '3', gen());
			albums = albums.slice(0, 3);
			var tracks = [];
			for (var album of albums) {
				var albumTracks = yield pm.getAlbum(album.album.albumId, true, gen());
				tracks = tracks.concat(albumTracks.tracks);
			}
			callback(null, tracks);
		} catch (err) {
			callback(err);
		}
	});
};

var getLibrary = function(callback) {
	run(function*(gen) {
		try {
			if (!CACHED_LIBRARY) {
				var lib = yield pm.getAllTracks(gen());
				if(!lib.data) {
					CACHED_LIBRARY = [];
				} else {
					// each page only has 1000 tracks, get every page
					var items = lib.data.items;
					while (lib.nextPageToken) {
						lib = yield pm.getAllTracks({ nextPageToken: lib.nextPageToken }, gen());
						if (lib.data) {
							items = items.concat(lib.data.items);
						}
					}

					items = items.map((item) => {
						if (!item.storeId) {
							item.nid = item.id;
						}
						return item;
					});

					CACHED_LIBRARY = items;
				}
			}
			callback(null, CACHED_LIBRARY);
		} catch (err) {
			callback(err);
		}
	});
};

var getLibraryTracks = function(q, callback) {
	run(function*(gen) {
		try {
			var tracks = yield getLibrary(gen());
			var fuse = new Fuse(tracks, FUSE_OPTIONS);
			tracks = fuse.search(q);
			callback(null, tracks.slice(0, 50));
		} catch (err) {
			callback(err);
		}
	});
};

var getUploadedTracks = function(q, callback) {
	run(function*(gen) {
		try {
			var tracks = yield getLibrary(gen());
			tracks = tracks.filter((track) => {
				return (typeof track.storeId === 'undefined');
			});
			var fuse = new Fuse(tracks, FUSE_OPTIONS);
			tracks = fuse.search(q);
			callback(null, tracks.slice(0, 50));
		} catch (err) {
			callback(err);
		}
	});
};

var getPlaylistTracks = function(q, callback) {
	run(function*(gen) {
		try {
			var playlistNames;
			if (CACHED_PLAYLIST_NAMES) {
				if (CACHED_PLAYLIST_NAMES.length === 0) return callback(null, []);
				playlistNames = CACHED_PLAYLIST_NAMES;
			} else {
				playlistNames = yield pm.getPlayLists(gen());
				if (!playlistNames.data) {
					CACHED_PLAYLIST_NAMES = [];
					return callback(null, []);
				}
			}

			var fuse = new Fuse(playlistNames.data.items, { keys: ['name'] });
			playlistNames = fuse.search(q);
			if (playlistNames.length === 0) return callback(null, []);


			var playlistTracks;
			if (CACHED_PLAYLIST_TRACKS) {
				if (CACHED_PLAYLIST_TRACKS.length === 0) return callback(null, []);
				playlistTracks = CACHED_PLAYLIST_TRACKS;
			} else {
				var entries = yield pm.getPlayListEntries(gen());
				if (!entries.data) {
					CACHED_PLAYLIST_TRACKS = [];
					return callback(null, []);
				}

				// each page only has 1000 tracks, get every page
				playlistTracks = entries.data.items;
				while (entries.nextPageToken) {
					entries = yield pm.getPlayListEntries({ nextPageToken: entries.nextPageToken }, gen());
					if (entries.data) {
						playlistTracks = playlistTracks.concat(playlistTracks.data.items);
					}
				}

				CACHED_PLAYLIST_TRACKS = playlistTracks;
			}

			var tracks = [];
			var lib;
			playlistNames.forEach((name) => {
				playlistTracks.forEach((track) => {
					// filter out uploaded track because they're missing all the required metadata. todo: find workaround.
					console.log(track);
					if (name.id === track.playlistId) {
						if (track.source === '1') {
							// Uploaded Track
							run(function*(gen) {
								if (!lib) {
									lib = yield getLibrary(gen());
								}
								lib.some((libTrack) => {
									if (track.trackId === libTrack.nid) {
										tracks.push(libTrack);
										return true;
									}
									return false;
								});
							});
						} else {
							track.track.nid = track.track.storeId;
							tracks.push(track.track);
						}
					}
				});
			});

			callback(null, tracks);
		} catch (err) {
			callback(err);
		}
	});
};

var getFavoriteTracks = function(q, callback) {
	run(function*(gen) {
		try {
			var favs;
			if (CACHED_FAVORITES) {
				if (CACHED_FAVORITES.length === 0) return callback(null, []);
				favs = CACHED_FAVORITES;
			} else {
				favs = yield pm.getFavorites(gen());
				if (!favs.track) {
					CACHED_FAVORITES = [];
					return callback(null, []);
				}

				favs = favs.track.map((fav) => {
					fav.nid = fav.id;
					fav.albumArtRef = [{ url: fav.imageBaseUrl }];
					return fav;
				});

				CACHED_FAVORITES = favs;
			}

			if (q) {
				// if there's a search query filter the results
				var fuse = new Fuse(favs, FUSE_OPTIONS);
				favs = fuse.search(q);
			}

			callback(null, favs);
		} catch (err) {
			console.log(err);
			callback(err);
		}
	});
};

// Setup the list of commands
const CMD = {
	al: {
		fn: getAlbumTracks
	},
	pl: {
		fn: getPlaylistTracks
	},
	fav: {
		fn: getFavoriteTracks,
		qOptional: true
	},
	lib: {
		fn: getLibraryTracks
	},
	up: {
		fn: getUploadedTracks
	}
};

// Here we register a HTTP endpoint that handles searching Play Music for tracks
// Expected URL: /tracks?q=<SearchTerms>
app.get('/tracks', (req, res) => {
	if (req.query.q) {
		var q = parseQuery(req.query.q);

		if (!q.q && !q.qOptional) {
			res.writeHead(200);
			res.end('');
		} else {
			// q -parameter found
			console.log(`Got a search request: ${req.query.q}`);

			run(function*(gen) {
				try {
					var tracks;
					if (q.cmd && CMD[q.cmd]) {
						tracks = yield CMD[q.cmd].fn(q.q, gen());
					} else {
						tracks = yield getTracks(q.q, gen());
					}

					CACHED_VIDEOS = {};
					tracks.forEach((track) => {
						CACHED_VIDEOS[track.nid] = track;
					});

					// Write contents to browser
					res.writeHead(200);
					res.end(parseSearch(tracks));
				} catch (err) {
					console.error(err);
					res.writeHead(500);
					res.end(`Error loading tracks for ${req.query.q}`);
				}
			});
		}
	} else if (req.query.v) {
		console.log('Loading IDs...');
		var videoIds = req.query.v.split(',');
		var tracks = videoIds.map((id) => {
			if (id.startsWith('*')) id = id.slice(1);
			return CACHED_VIDEOS[id];
		}).filter((track) => {
			return track;
		});
		// Write contents to browser
		res.writeHead(200);
		res.end(parseVideos(tracks));
	}
});

// Here we register a HTTP endpoint that streams a given Play Music ID as an mp3-file
// Expected URL: /tracks/:id/stream
app.get('/tracks/:id/stream', (req, res) => {
	var id = req.params.id;
	run(function*(gen) {
		try {
			if (id.startsWith('*')) id = id.slice(1);
			console.log(`Got a stream request for Play Music id: ${id}`);
			var url = yield pm.getStreamUrl(id, gen());

			// Set the HTTP-headers to audio/mpeg
			res.setHeader('Content-Type', 'audio/mpeg');
			res.writeHead(200);

			// Initialize ffmpeg, which is used for the mp3-conversion
			proc = new ffmpeg({ source: url });

			// Error handling
			proc.on('error', (err, stdout, stderr) => {
				// "Output stream closed" error message is ignored, it is caused by browsers doing a double HTTP-request
				if (err.message !== 'Output stream closed') throw err;
			});

			// Set audio format and begin streaming
			proc.toFormat('mp3');
			proc.audioBitrate(CONFIG.Settings.Bitrate);
			proc.writeToStream(res, { end: true });
		} catch (err) {
			console.error(err);
			res.writeHead(500);
			res.end(`Error loading stream for ${req.params.id}`);
		}
	});
});

// Script execution begins here
if (API_KEY.androidId && API_KEY.masterToken) {
	// Credentials have been set, start the server and listen for incoming connections to our HTTP endpoints
	pm.init({ androidId: API_KEY.androidId, masterToken: API_KEY.masterToken }, (err) => {
		if (err) console.error(err);
		else {
			// Cache Library
			console.log('Caching library...');
			getLibrary((err) => {
				if (err) console.error(err);
				else console.log('Library cached.');
			});

			// Start server
			app.listen(CONFIG.Settings.ServerPort, () => {
				console.log('Starting Proxy');
				spawn('node', [path.join(DIR, 'js/proxy.js')]);
			});
			console.log('Server running');
			console.log('CTRL+C to shutdown');
		}
	});
} else {
	// Credentials key has not been set
	console.log('API keys have not been set. Login using login.js.');
}

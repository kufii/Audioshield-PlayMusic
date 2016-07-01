// Audioshield-PlayMusic
// Fork of Audioshield-Tubifier by https://www.reddit.com/user/-olli-

// Load the credentails
const API_KEY = require('./apikey.json');

// Load a template for an empty response from Soundcloud API. This will be filled with values from the Play Music API.
const soundcloudTemplate = require('./soundcloud_template.json');

// Required libraries
const fs = require('fs');
const PlayMusic = require('playmusic');
const ffmpeg = require('fluent-ffmpeg');
const https = require('https');
const express = require('express');
const run = require('gen-run');
const Fuse = require('fuse.js');

var app = express();
var pm = new PlayMusic();

// Setting a dummy HTTPS certificate
var options = {
	key: fs.readFileSync('./key.pem'),
	cert: fs.readFileSync('./cert.pem'),
	passphrase: "audioshield"
};

var parseQuery = function(q) {
	q = q && q.trim();
	if (!q || q === '-') return { qRequired: true };
	if (q.charAt(0) !== '-') return { q: q, qRequired: true };

	var indexOfSpace = q.indexOf(' ');
	if (indexOfSpace < 0) return { cmd: q.slice(1) };
	var cmd = q.slice(1, indexOfSpace);
	var qRequired = true;
	if (CMD[cmd] && !CMD[cmd].qRequired) {
		qRequired = false;
	}
	return { cmd: cmd, q: q.slice(indexOfSpace + 1), qRequired: qRequired };
};

var parseTracks = function(tracks) {
	var output = tracks.map((track) => {
		var soundcloudResponse = JSON.parse(JSON.stringify(soundcloudTemplate));
		// Fill the template with values from the Play Music API response
		// Note specially the stream_url -field, which is set to correspond to our /stream HTTPS endpoint
		soundcloudResponse.title = track.title;
		soundcloudResponse.id = track.nid;
		soundcloudResponse.artwork_url = track.albumArtRef[0].url;
		soundcloudResponse.user.username = track.artist;
		soundcloudResponse.stream_url = `https://api.soundcloud.com/stream?id=${soundcloudResponse.id}`;
		soundcloudResponse.uri = `https://api.soundcloud.com/stream/${soundcloudResponse.id}`;
		soundcloudResponse.permalink = soundcloudResponse.id;
		soundcloudResponse.permalink_url = soundcloudResponse.uri;

		return soundcloudResponse;
	});

	// Return the constructed output in JSON-format
	return JSON.stringify(output);
};

var getMusic = function(q, entryType, callback) {
	pm.search(q, 20, (err, data) => {
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

var getPlaylistTracks = function(q, callback) {
	run(function*(gen) {
		try {
			var playlistNames = yield pm.getPlayLists(gen());
			if (!playlistNames.data) return callback(null, []);
			var fuse = new Fuse(playlistNames.data.items, { keys: ['name'] });
			playlistNames = fuse.search(q);
			if (playlistNames.length === 0) return callback(null, []);

			var playlistTracks = yield pm.getPlayListEntries(gen());
			if (!playlistTracks.data) return callback(null, []);

			var tracks = [];
			playlistNames.forEach((name) => {
				playlistTracks.data.items.forEach((track) => {
					// filter out uploaded track because they're missing all the required metadata. todo: find workaround.
					if (track.source === '2' && name.id === track.playlistId) {
						track.track.nid = track.track.storeId;
						tracks.push(track.track);
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
			var favs = yield pm.getFavorites(gen());
			if (!favs.track) return callback(null, []);
			favs = favs.track;

			if (q) {
				// if there's a search query filter the results
				var fuse = new Fuse(favs, {
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
				});
				favs = fuse.search(q);
			}

			favs = favs.map((fav) => {
				fav.nid = fav.id;
				fav.albumArtRef = [{ url: fav.imageBaseUrl }];
				return fav;
			});

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
		fn: getAlbumTracks,
		qRequired: true
	},
	pl: {
		fn: getPlaylistTracks,
		qRequired: true
	},
	fav: {
		fn: getFavoriteTracks,
		qRequired: false
	}
};

// Here we register a HTTPS endpoint that streams a given Play Music ID as an mp3-file
// Expected URL: https://api.soundcloud.com/stream?id=<ID>
app.get('/stream', (req, res) => {
	// Are we missing the id -parameter or is it empty?
	if (!req.query.id) {
		res.writeHead(500);
		res.end("parameter 'id' missing or empty");
	} else {
		// id -parameter found
		// Audioshield appends any stream url it gets with another query variable, so we have to split it, and only use the first part
		var id = req.query.id.split("?")[0];

		console.log(`Got a stream request for Play Music id: ${id}`);

		run(function*(gen) {
			try {
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
				proc.audioBitrate(320);
				proc.writeToStream(res, { end: true });
			} catch (err) {
				res.writeHead(500);
				res.end(`Error loading stream for ${id}`);
			}
		});
	}
});

// Here we register a HTTPS endpoint that handles searching Play Music for tracks
// This endpoint format is set by Audioshield, so we have to follow it
// Expected URL: https://api.soundcloud.com/tracks?q=<SearchTerms>
app.get('/tracks', (req, res) => {
	// Are we missing the q -parameter or is it empty?
	var q = parseQuery(req.query.q);

	if (!q.q && q.qRequired) {
		res.writeHead(200);
		res.end('');
	} else {
		// q -parameter found
		console.log(`Got a search request: ${req.query.q}`);

		run(function*(gen) {
			var tracks;
			if (q.cmd && CMD[q.cmd]) {
				tracks = yield CMD[q.cmd].fn(q.q, gen());
			} else {
				tracks = yield getTracks(q.q, gen());
			}

			var content = parseTracks(tracks);

			// Write contents to browser
			res.writeHead(200);
			res.end(content);
		});
	}
});

// Script execution begins here
if (API_KEY.androidId !== '-1' && API_KEY.masterToken !== '-1') {
	// Credentials have been set, start the server and listen for incoming connections to our HTTPS endpoints
	// Audioshield expects HTTPS port 443
	pm.init({ androidId: API_KEY.androidId, masterToken: API_KEY.masterToken }, () => {
		var httpsServer = https.createServer(options, app);
		httpsServer.listen(443);
		console.log('Server running');
		console.log('CTRL+C to shutdown');
	});
} else {
	// Credentials key has not been set
	console.log('API keys have not been set. Login using login.js.');
}

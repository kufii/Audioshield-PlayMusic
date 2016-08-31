const path = require('path');
const fs = require('fs');
const read = require('read');
const run = require('gen-run');
const PlayMusic = require('playmusic');
const DIR = path.join(__dirname, '..');
const API_FILE = path.join(DIR, 'api/apikey.json');
var pm = new PlayMusic();


run(function* (gen) {
	var isLoggedIn = false;
	while (!isLoggedIn) {
		try {
			var email = yield read({prompt: 'Email: '}, gen());
			var password = yield read({prompt: 'Password (generate an app password if using 2 factor authentication): ', silent: true}, gen());
			var resp = yield pm.login({email: email, password: password}, gen());
			var apikey = {
				androidId: resp.androidId,
				masterToken: resp.masterToken
			};
			fs.writeFile(API_FILE, JSON.stringify(apikey, null, 4), (err) => {
				if (err) console.error(err);
				else console.log('Successfully logged into Google Play Music.');
			});
			isLoggedIn = true;
		} catch (err) {
			console.log('Email or Password incorrect.\n');
		}
	}
});
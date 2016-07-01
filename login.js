const fs = require('fs');
const read = require('read');
const run = require('gen-run');
const PlayMusic = require('playmusic');
const API_FILE = './apikey.json';
var pm = new PlayMusic();


run(function* (gen) {
	var email = yield read({prompt: 'Email: '}, gen());
	var password = yield read({prompt: 'Password (generate an app password if using 2 factor authentication): ', silent: true}, gen());

	pm.login({email: email, password: password}, (err, resp) => {
		if (err) 
			console.log('Email or Password incorrect.');
		else {
			var apikey = {};
			apikey.androidId = resp.androidId;
			apikey.masterToken = resp.masterToken;
			fs.writeFile(API_FILE, JSON.stringify(apikey, null, 4), (err) => {
				if (err) 
					console.error(err);
				else 
					console.log('Successfully logged into Google Play Music.');
			});
		}
	});
});
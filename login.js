const PM_CRED = require('./pmcred.json');
const PlayMusic = require('playmusic');
var pm = new PlayMusic();

if (PM_CRED.email !== -1) {
	pm.login({email: PM_CRED.email, password: PM_CRED.password}, (err, resp) => {
		if (err) console.error(err);
		else {
			console.log('Logged in to Play Music, enter the following data into apikey.json. You can now clear pmcred.json.');
			console.log(`androidId: ${resp.androidId}`);
			console.log(`masterToken: ${resp.masterToken}`);
		}
	});
} else {
	console.log('Enter your email and password in pmcred.json');
}
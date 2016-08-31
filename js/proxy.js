const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const http = require('http');
const net = require('net');
const url = require('url');
const ini = require('ini');
const DIR = path.join(__dirname, '..');
const CONFIG = ini.parse(fs.readFileSync(path.join(DIR, 'config.ini'), 'utf-8'));

// https://nodejs.org/api/http.html#http_event_connect
// http://stackoverflow.com/questions/20351637/how-to-create-a-simple-http-proxy-in-node-js
// http://www.catonmat.net/http-proxy-in-nodejs/
// Thanks to reddit user /u/hurzhurz for helping with this

var proxy = http.createServer((request, response) => {
	console.log('serve: ' + request.url);
	var requrl = url.parse(request.url);
	var options = {
		hostname: requrl.hostname,
		port: requrl.port,
		path: requrl.path,
		method: request.method,
		headers: request.headers
	};
	var proxy_request = http.request(options);
	proxy_request.addListener('response', function (proxy_response) {
		proxy_response.addListener('data', function(chunk) {
			response.write(chunk, 'binary');
		});
		proxy_response.addListener('end', function() {
			response.end();
		});
		response.writeHead(proxy_response.statusCode, proxy_response.headers);
	});
	proxy_request.on('error', (err) => {
		console.log(`ERROR: ${err.message}`);
	});
	request.addListener('data', function(chunk) {
		proxy_request.write(chunk, 'binary');
	});
	request.addListener('end', function() {
		proxy_request.end();
	});
});

proxy.on('connect', (req, cltSocket, head) => {
	var host;
	var port;
	console.log(req.url);

	if (req.url == 'api.soundcloud.com:443' && req.headers['user-agent'].indexOf('UnityPlayer') !== -1) {
		// connect to fake soundcloud
		host = '127.0.0.1';
		port = '443';
		console.log('Redirecting to fake soundcloud');
	} else {
		// connect to real server
		var srvUrl = url.parse(`http://${req.url}`);
		host = srvUrl.hostname;
		port = srvUrl.port;
	}

	var srvSocket = net.connect(port, host, () => {
		cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
									'Proxy-agent: Node.js-Proxy\r\n' +
									'\r\n');
		srvSocket.write(head);
		srvSocket.pipe(cltSocket);
		cltSocket.pipe(srvSocket);
	});
	srvSocket.on('error', (err) => {
		console.log(`ERROR: ${err.message}`);
	});
});

// now that proxy is running
proxy.listen(CONFIG.Proxy.Port, '127.0.0.1', () => {
	console.log('Starting Audioshield');
	spawn(CONFIG.Paths.Steam, ['-applaunch', '412740']);
});
console.log('Proxy running');
console.log('CTRL+C to shutdown');
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

	var onResponse = (proxy_response) => {
		var responseData = '';
		proxy_response.addListener('data', (chunk) => {
			responseData += chunk;
			response.write(chunk, 'binary');
		});
		proxy_response.addListener('end', () => {
			if (options.hostname.match(/^(?:www\.)?audiosurf2\.com$/) && (options.path === '/shield/download_yash.php') && options.headers['user-agent'].indexOf('UnityPlayer') !== -1) {
				// console.log(`RESPONSE: ${responseData}`);
			}
			response.end();
		});
		response.writeHead(proxy_response.statusCode, proxy_response.headers);
	};

	var onError = (err) => {
		console.log(`ERROR: ${err.message}`);
	};

	proxy_request.addListener('response', onResponse);
	proxy_request.on('error', onError);
	var requestData = '';
	request.addListener('data', (chunk) => {
		requestData += chunk;
	});
	request.addListener('end', () => {
		if (options.hostname.match(/^(?:www\.)?audiosurf2\.com$/) && (options.path === '/shield/airgame_youtube.php' || options.path === '/shield/download_yash.php') && options.headers['user-agent'].indexOf('UnityPlayer') !== -1) {
			var searchMatch = requestData.match(/searchtext=([^&]*)/);
			if (searchMatch && searchMatch[1].toLowerCase().startsWith('-yt ')) {
				console.log('Falling back to Youtube search');
				requestData.replace(/searchtext=-yt /i, 'searchtext=');
				searchMatch = null;
			}
			var videoMatch = requestData.match(/videoids=(\*[^&]*)/);
			var streamMatch = requestData.match(/^id=(\*.*)/);
			var doRequest = (path) => {
				console.log('Redirecting to Play Music');
				http.get({
					hostname: '127.0.0.1',
					path: path,
					port: CONFIG.Settings.ServerPort
				}, onResponse).on('error', onError);
				proxy_request.abort();
			};
			if (searchMatch) {
				console.log('Redirecting to Play Music');
				doRequest(`/tracks?q=${searchMatch[1]}`);
			} else if (videoMatch) {
				doRequest(`/tracks?v=${videoMatch[1]}`);
			} else if (streamMatch) {
				console.log('Streaming Play Music');
				doRequest(`/tracks/${streamMatch[1]}/stream`);
			} else {
				//console.log(`REQUEST: ${requestData}`);
				proxy_request.write(requestData, 'binary');
			}
		} else {
			proxy_request.write(requestData, 'binary');
		}
		proxy_request.end();
	});
});

proxy.on('connect', (req, cltSocket, head) => {
	var host;
	var port;
	console.log(req.url);
	var srvUrl = url.parse(`http://${req.url}`);
	host = srvUrl.hostname;
	port = srvUrl.port;

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
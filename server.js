import https from 'https';
import path from 'path';
import fs from 'fs';
import URL from 'url';
import querystring from 'querystring';
import { getIPAddress } from './util.js';
import { setupWebSocketServer } from './websocket.js';
import { randomUUID } from 'crypto';

const server = https.createServer({
	key: fs.readFileSync(path.resolve(process.env.HOME, '.ca/key.pem')),
	cert: fs.readFileSync(path.resolve(process.env.HOME, '.ca/cert.pem')),
}, handleRequest).listen(3000, () => {
	const address = getIPAddress();
	console.log(`app started. \nstream address: https://${address}:3000/stream.html\nlive address: https://${address}:3000/live.html`);
});

async function handleRequest(req, res) {
	const handled = await handleStaticResource(req, res);
	if (!handled) {
		handle404Response(req, res);
	}
	console.log(`request: ${req.url}, status: ${res.statusCode}`);
}

async function handleStaticResource(req, res) {
	const url = URL.parse(req.url);
	const params = querystring.parse(url.query);
	if (url.pathname === '/stream.html' || url.pathname === '/live.html') {
		if (!params.id) {
			const id = randomUUID();
			res.statusCode = 301;
			console.log(req);
			res.setHeader('location', `https://${req.headers['host']}${url.pathname}?id=${id}`);
			res.end();
			return true;
		}
	}
	let filepath = path.resolve(process.cwd(), 'static', url.pathname.slice(1));
	try {
		let stats = await fs.promises.stat(filepath);
		if (stats.isDirectory()) {
			filepath = path.resolve(filepath, './index.html');
			stats = await fs.promises.stat(filepath);
		}
		res.statusCode = 200;
		res.setHeader('Content-Length', stats.size);
		const fileReadStream = fs.createReadStream(filepath);
		fileReadStream.pipe(res);
		return true;
	} catch (e) {
		return false;
	}
}

function handle404Response(req, res) {
	res.statusCode = 404;
	res.end(`404 Not Found | ${req.url}`);
}

setupWebSocketServer(server);

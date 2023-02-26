import http from 'http';
import path from 'path';
import fs from 'fs';
import { getIPAddress } from './util.js';
import { setupWebSocketServer } from './websocket.js';

const server = http.createServer(handleRequest).listen(3001, () => {
	const address = getIPAddress();
	console.log('app started at: \n', `http://localhost:3001\n`, `http://${address}:3001\n`);
});

async function handleRequest(req, res) {
	const handled = await handleStaticResource(req, res);
	if (!handled) {
		handle404Response(req, res);
	}
	console.log(`request: ${req.url}, status: ${res.statusCode}`);
}

async function handleStaticResource(req, res) {
	const queryStartIndex = req.url.indexOf('?');
	let filepath = path.resolve(process.cwd(), 'static', req.url.slice(1, queryStartIndex === -1 ? undefined : queryStartIndex));
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

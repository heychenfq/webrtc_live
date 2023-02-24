import os from 'os';
import http from 'http';
import path from 'path';
import fs from 'fs';
import debug from 'debug';

const log = debug('http');
debug.enable('http');

const server = http.createServer(async (req, res) => {
	const handled = await handleStaticResource(req, res);
	if (!handled) {
		res.statusCode = 404;
		res.end();
	}
	log(`request: ${req.url}, status: ${res.statusCode}`);
});

server.listen(3001, () => {
	const networdDevices = os.networkInterfaces();
	const address = Object.values(networdDevices).reduce((memo, i) => {
		return memo.concat(i);
	}, []).find(i => {
		return !i.internal && i.family === 'IPv4';
	}).address;
	log('app started at: ', `http://${address}:3001`);
});

async function handleStaticResource(req, res) {
	const queryStartIndex = req.url.indexOf('?');
	let filepath = path.resolve(process.cwd(), 'src/client', req.url.slice(1, queryStartIndex === -1 ? undefined : queryStartIndex + 1));
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
import url from 'url';
import querystring from 'querystring';
import { WebSocketServer } from 'ws';

export function setupWebSocketServer(server) {
	const wsServer = new WebSocketServer({
		server,
	});
	wsServer.addListener('connection', (client, request) => {
		const id = querystring.parse(url.parse(request.url).query).id;
		if (!id) {
			client.close();
			return;
		}
		client.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);
			const { payload, to } = data;
			if (payload) {
				const targetClient = [...wsServer.clients].find(c => c.id === to);
				if (targetClient) {
					targetClient.send(JSON.stringify({
						from: client.id,
						payload,
					}));
				}
			}
		});
		client.id = id;
	});
}

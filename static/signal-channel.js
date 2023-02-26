
function createSignalChannel() {
	const signalChannel = new EventTarget();
	const id = new URLSearchParams(location.search).get('id');
	let ws = new WebSocket(`wss://${location.hostname}:${location.port}/?id=${id}`);
	function addWSListener(ws) {
		ws.addEventListener('open', () => {
			console.log('ws connected.');
			dataQueue.forEach(i => {
				ws.send(JSON.stringify(i));
			});
			dataQueue.length = 0;
		});
		ws.addEventListener('error', () => {
			console.log('ws error occurred, reconnecting...');
			ws.close();
			ws = new WebSocket(`wss://${location.hostname}:${location.port}/?id=${id}`);
			addWSListener(ws);
		});
		ws.addEventListener('close', () => {
			console.log('ws closed, reconnecting...');
			ws = new WebSocket(`wss://${location.hostname}:${location.port}/?id=${id}`);
			addWSListener(ws);
		});
		ws.addEventListener('message', (e) => {
			const msgEvent = new MessageEvent('message', { data: JSON.parse(e.data) });
			console.log('receive data: ', msgEvent.data);
			signalChannel.dispatchEvent(msgEvent);
		});
	}
	addWSListener(ws);
	signalChannel.send = (msg) => {
		if (ws.readyState !== ws.OPEN) {
			dataQueue.push(msg);
		} else {
			ws.send(JSON.stringify(msg));
		}
	};
	return signalChannel;
}

const dataQueue = [];

window.signalChannel = createSignalChannel();
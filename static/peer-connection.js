(function () {
	const connections = new Map();

	function createConnection(to, onRemoveAddTrack) {
		const peerConnection = new RTCPeerConnection();
		const connection = {
			id: to,
			peerConnection,
			dataChannel: null,
		};
		connections.set(to, connection);
		peerConnection.addEventListener('icecandidate', (event) => {
			signalChannel.send({
				to,
				payload: {
					type: 'candidate',
					candidate: event.candidate,
				},
			});
		});
		peerConnection.addEventListener('icecandidateerror', (event) => {
			console.log(event);
		});
		peerConnection.addEventListener('negotiationneeded', () => {
			console.log('negotiationneeded');
			createOffer(connection, to, false);
		});
		peerConnection.addEventListener('datachannel', (event) => {
			connection.dataChannel = event.channel;
		});
		peerConnection.addEventListener('track', (event) => {
			const track = event.track;
			onRemoveAddTrack?.(track);
		});
		peerConnection.addEventListener('connectionstatechange', () => {
			console.log('peer connection state change, from: ', to, 'state: ', peerConnection.connectionState);
			if (peerConnection.connectionState === 'disconnected') {
				connections.delete(to);
			}
		});
		return connection;
	}

	async function addSignalChannelListener() {
		signalChannel.addEventListener('message', async ({ data }) => {
			const from = data.from;
			let connection = connections.get(from);
			if (data.payload.type === 'offer' && data.payload.first) {
				connection = createConnection(from);
				renderer.tracks.forEach(track => {
					connection.peerConnection.addTrack(track);
				});
			}
			if (data.payload.type === 'offer') {
				await handleOffer(connection, data);
			}
			if (data.payload.type === 'answer') {
				await handleAnswer(connection, data);
			}
			if (data.payload.type === 'candidate') {
				await handleICECandidate(connection, data);
			}
		});
	}

	async function createOffer(connection, to, first) {
		const peerConnection = connection.peerConnection;
		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);
		signalChannel.send({
			to,
			payload: {
				type: offer.type,
				sdp: offer.sdp,
				first,
			},
		});
	}

	async function handleOffer(connection, data) {
		const peerConnection = connection.peerConnection;
		await peerConnection.setRemoteDescription(data.payload);
		const answer = await peerConnection.createAnswer();
		await peerConnection.setLocalDescription(answer);
		signalChannel.send({
			to: data.from,
			payload: answer,
		});
	}

	async function handleAnswer(connection, data) {
		const peerConnection = connection.peerConnection;
		await peerConnection.setRemoteDescription(data.payload);
	}

	async function handleICECandidate(connection, data) {
		const peerConnection = connection.peerConnection;
		try {
			await peerConnection.addIceCandidate(data.payload.candidate);
		} catch (e) {
			console.log(e, data.payload.candidate);
		}
	}

	async function connect(to, onRemoveAddTrack) {
		addSignalChannelListener();
		const connection = createConnection(to, onRemoveAddTrack);
		connection.dataChannel = connection.peerConnection.createDataChannel('dc');
		await createOffer(connection, to, true);
	}

	async function waitingConnect() {
		addSignalChannelListener();
	}
	globalThis.peerConnection = {
		connections,
		connect,
		waitingConnect,
	};
})();




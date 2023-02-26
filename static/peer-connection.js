(function () {
	const connections = new Map();

	function createConnection(to, videoElement) {
		const peerConnection = new RTCPeerConnection();
		const connection = {
			id: to,
			peerConnection,
			dataChannel: null,
			mediaStream: new MediaStream(),
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
			createOffer(connection, to);
		});
		peerConnection.addEventListener('datachannel', (event) => {
			connection.dataChannel = event.channel;
		});
		peerConnection.addEventListener('track', (event) => {
			const track = event.track;
			if (track.kind === 'video') {
				videoElement.srcObject = connection.mediaStream;
			}
			connection.mediaStream.addTrack(event.track);
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
			if (!connection) {
				if (data.payload.type === 'offer') {
					connection = createConnection(from);
					connection.peerConnection.addTrack(renderEngine.videoTrack);
					renderEngine.audioTracks.forEach(track => {
						connection.peerConnection.addTrack(track);
					});
					createDataChannel(connection);
				} else {
					return;
				}
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

	async function createDataChannel(connection) {
		const peerConnection = connection.peerConnection;
		connection.dataChannel = peerConnection.createDataChannel("");
	}

	async function createOffer(connection, to) {
		const peerConnection = connection.peerConnection;
		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);
		signalChannel.send({
			to,
			payload: offer,
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

	async function connect(to, videoElement) {
		addSignalChannelListener();
		await createOffer(createConnection(to, videoElement), to);
	}

	async function waitingConnect() {
		addSignalChannelListener();
	}
	globalThis.peerConnectionNS = {
		connections,
		connect,
		waitingConnect,
	};
})();




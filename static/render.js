
(function () {
	const tracks = new Set();
	const trackSettings = new Map();
	const canvas = document.getElementById('canvas');
	const ctx = canvas.getContext('2d');
	const videoTrack = canvas.captureStream().getTracks()[0];

	function addTrack(track) {
		tracks.add(track);
		trackSettings.set(track, {});
		if (track.kind === 'video') {
			const video = document.createElement('video');
			video.srcObject = new MediaStream([track]);
			video.autoplay = true;
			trackSettings.get(track).video = video;
		}
		peerConnectionNS.connections.forEach(connection => {
			const peerConnection = connection.peerConnection;
			connection.mediaStream.addTrack(track);
			peerConnection.addTrack(track, connection.mediaStream);
		});
	};

	function removeTrack(track) {
		trackSettings.delete(track);
		tracks.delete(track);
		track.stop();
		peerConnectionNS.connections.forEach(connection => {
			const peerConnection = connection.peerConnection;
			const sender = peerConnection.getSenders().find(i => i.track === track);
			peerConnection.removeTrack(sender);
		});
	};

	function render() {
		ctx.fillRect(0, 0, canvas.width, canvas.height, '#ddd');
		for (const [track, option] of trackSettings) {
			if (track.kind === 'video') {
				const settings = track.getSettings();
				ctx.drawImage(option.video, 0, 0, settings.width, settings.height, 0, 0, settings.width, settings.height);
			}
		}
		requestAnimationFrame(render);
	}

	render();

	globalThis.renderEngine = {
		ctx,
		addTrack,
		removeTrack,
		videoTrack,
		tracks,
		get audioTracks() {
			return Array.from(tracks.values()).filter(track => track.kind === 'audio');
		},
	};
})();
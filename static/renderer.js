
(function () {
	const canvas = document.getElementById('canvas');
	const ctx = canvas.getContext('2d');
	const videoTrack = canvas.captureStream().getTracks()[0];
	const sources = new Map();
	const videoElements = new Map();

	function addSource(source) {
		sources.set(source.id, source);
	}

	function removeSource(id) {
		const source = sources.get(id);
		if (!source) {
			return;
		}
		source.clear();
		sources.delete(id);
	}

	function createSourceFromTrack(props) {
		const source = {
			id: Math.random().toString(16).slice(2),
			type: 'track',
			track: props.track,
			transform: {},
			clear() {
				props.track.stop();
				if (props.track.kind === 'audio') {
					peerConnection.connections.forEach(connection => {
						const peerConnection = connection.peerConnection;
						const sender = peerConnection.getSenders().find(i => i.track === track);
						peerConnection.removeTrack(sender);
					});
				}
				if (props.track.kind === 'video') {
					videoElements.delete(source.id);
				}
			},
		};
		if (props.track.kind === 'audio') {
			peerConnection.connections.forEach(connection => {
				connection.peerConnection.addTrack(track);
			});
		}
		if (props.track.kind === 'video') {
			const videoElement = document.createElement('video');
			videoElement.autoplay = true;
			videoElement.style.filter = 'blur(3px)';
			videoElement.srcObject = new MediaStream([source.track]);
			videoElements.set(source.id, videoElement);
		}
		return source;
	}

	function render() {
		ctx.fillRect(0, 0, canvas.width, canvas.height, '#ddd');
		for (const [id, source] of sources) {
			if (source.type === 'track' && source.track.kind === 'video') {
				let videoElement = videoElements.get(id);
				const settings = source.track.getSettings();
				ctx.drawImage(videoElement, 0, 0, settings.width, settings.height, 0, 0, Math.min(settings.width, canvas.width), Math.min(settings.height, canvas.width));
			}
		}
		requestAnimationFrame(render);
	}

	render();

	globalThis.renderer = {
		sources,
		get tracks() {
			return [videoTrack, ...Array.from(sources.values()).filter(i => i.type === 'track' && i.track.kind === 'audio').map(i => i.track)];
		},
		addSource,
		removeSource,
		createSourceFromTrack,
	};
})();


(function () {
	async function requestPermission() {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			});
			mediaStream.getTracks().forEach((mediaStreamStack) => {
				mediaStreamStack.stop();
			});
			return true;
		} catch (e) {
			alert(e.message);
			return false;
		}
	}

	async function enumerateDevices() {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter(device => device.deviceId !== 'default' && device.kind !== 'audiooutput');
	}

	async function captureDevice(deviceId, type) {
		mediaStream = await navigator.mediaDevices.getUserMedia({
			[type === 'videoinput' ? 'video' : 'audio']: {
				deviceId: {
					exact: deviceId,
				}
			},
		});
		mediaStream.getTracks().forEach((track) => {
			renderEngine.addTrack(track);
		});
	}

	async function captureDisplay() {
		const stream = await navigator.mediaDevices.getDisplayMedia({
			audio: true,
		});
		renderEngine.addTrack(stream.getTracks()[0]);
	}
	globalThis.mediaCapture = {
		requestPermission,
		enumerateDevices,
		captureDevice,
		captureDisplay,
	};
})();
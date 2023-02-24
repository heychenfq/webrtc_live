
const mediaDevices = navigator.mediaDevices;
window.audioStream = new MediaStream();

async function getPermission() {
	try {
		const mediaStream = await mediaDevices.getUserMedia({
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
	return mediaDevices.enumerateDevices();
}

async function autoRefreshDevices() {
	audioInputListElement.innerHTML = '';
	audioOutputListElement.innerHTML = '';
	videoInputListElement.innerHTML = '';
	const devices = await enumerateDevices();
	devices.forEach(device => {
		const itemElement = document.createElement('li');
		itemElement.id = device.deviceId;
		const contentElement = document.createElement('p');
		contentElement.innerText = device.label;
		itemElement.appendChild(contentElement);
		const addBtn = document.createElement('button');
		addBtn.innerText = 'add';
		contentElement.appendChild(addBtn);
		const removeBtn = document.createElement('button');
		removeBtn.innerText = 'remove';
		removeBtn.disabled = true;
		contentElement.appendChild(removeBtn);
		switch (device.kind) {
			case 'audioinput':
				audioInputListElement.appendChild(itemElement);
				let audioInputStreamStack;
				const handleAddAudioInputStack = async () => {
					const mediaStream = await mediaDevices.getUserMedia({
						audio: {
							deviceId: device.deviceId,
						},
					});
					audioInputStreamStack = mediaStream.getTracks()[0];
					audioStream.addTrack(audioInputStreamStack);
					addBtn.disabled = true;
					removeBtn.disabled = false;
				};
				const handleRemoveAudioInputStack = async () => {
					audioStream.removeTrack(audioInputStreamStack);
					audioInputStreamStack.stop();
					addBtn.disabled = false;
					removeBtn.disabled = true;
				};
				addBtn.addEventListener('click', handleAddAudioInputStack);
				removeBtn.addEventListener('click', handleRemoveAudioInputStack);
				break;
			case 'audiooutput':
				audioOutputListElement.appendChild(itemElement);
				let audioOutputStreamStack;
				const handleAddAudioOutputStack = async () => {
					const mediaStream = await mediaDevices.getUserMedia({
						audio: {
							deviceId: device.deviceId,
						},
					});
					audioOutputStreamStack = mediaStream.getTracks()[0];
					audioStream.addTrack(audioOutputStreamStack);
					addBtn.disabled = true;
					removeBtn.disabled = false;
				};
				const handleRemoveAudioOutputStack = async () => {
					audioStream.removeTrack(audioOutputStreamStack);
					audioOutputStreamStack.stop();
					addBtn.disabled = false;
					removeBtn.disabled = true;
				};
				addBtn.addEventListener('click', handleAddAudioOutputStack);
				removeBtn.addEventListener('click', handleRemoveAudioOutputStack);
				break;
			case 'videoinput':
				videoInputListElement.appendChild(itemElement);
				let mediaStream, videoElement;
				const handleAddVideoInputListener = async () => {
					mediaStream = await mediaDevices.getUserMedia({
						video: {
							deviceId: device.deviceId,
						},
					});
					videoElement = document.createElement('video');
					videoElement.srcObject = mediaStream;
					videoElement.autoplay = true;
					canvasElement.appendChild(videoElement);
					addBtn.disabled = true;
					removeBtn.disabled = false;
				};
				const handleRemoveVideoInputListener = async () => {
					canvasElement.removeChild(videoElement);
					mediaStream.getTracks().forEach((mediaStreamStack) => {
						mediaStreamStack.stop();
					});
					addBtn.disabled = false;
					removeBtn.disabled = true;
				};
				addBtn.addEventListener('click', handleAddVideoInputListener);
				removeBtn.addEventListener('click', handleRemoveVideoInputListener);
				break;
		}
	});
	mediaDevices.addEventListener('devicechange', autoRefreshDevices);
}

async function captureDisplay() {
	const stream = await navigator.mediaDevices.getDisplayMedia({
		video: {
			displaySurface: 'monitor',
		},
	});
	window.displayStream = stream;
	document.getElementById('video').srcObject = stream;
}
document.getElementById('capture-display-btn').onclick = captureDisplay;
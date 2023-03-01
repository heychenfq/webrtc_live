(function () {
	let mediaRecord = null;
	let resolveData;
	function startRecord(stream) {
		mediaRecord = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
		mediaRecord.addEventListener('dataavailable', (e) => {
			resolveData(e.data);
			resolveData = null;
			mediaRecord = null;
		});
		mediaRecord.start();
	}

	function stopRecord() {
		mediaRecord.stop();
		return new Promise((resolve) => {
			resolveData = resolve;
		});
	}
	globalThis.recorder = {
		start: startRecord,
		stop: stopRecord,
	}
})();
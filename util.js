import os from 'os';

export function getIPAddress() {
	const networkInterfaces = os.networkInterfaces();
	return Object.values(networkInterfaces).reduce((memo, i) => {
		return memo.concat(i);
	}, []).find(i => {
		return i.family === 'IPv4' && !i.internal;
	}).address;
}
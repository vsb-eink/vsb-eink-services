import { events } from './events.js';
import { db } from './database.js';
import axios from 'axios';
import { joinUrl } from './utils.js';
import { GROUPER_URL } from './environment.js';

export async function sync() {
	const promises = [];

	const groupsSync = (async () => {
		const groups = await db.panelGroup.findMany({
			select: {
				id: true,
				name: true,
				panels: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		await axios.put(joinUrl(GROUPER_URL, '/groups'), groups);
	})();
	promises.push(groupsSync);

	await Promise.all(promises);
}

export function createSyncWorker() {
	let dataToSync = false;
	let syncInProgress = false;
	let interval: NodeJS.Timeout | null = null;

	events.on('panel:change', () => {
		dataToSync = true;
	});

	events.on('panelGroup:change', () => {
		dataToSync = true;
	});

	const stop = () => interval && clearInterval(interval);
	const start = (ms: number) => {
		stop();
		interval = setInterval(async () => {
			if (syncInProgress) {
				return;
			}

			if (!dataToSync) {
				return;
			}

			syncInProgress = true;
			console.log('State changed, syncing data with other services...');
			await sync();
			dataToSync = false;
			syncInProgress = false;
			console.log('Data synced');
		}, ms);
	};

	return {
		stop,
		start,
	};
}

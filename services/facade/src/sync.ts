import { events } from './events.js';
import { db } from './database.js';
import axios from 'axios';
import { joinUrl } from './utils.js';
import { GROUPER_URL, SCHEDULER_URL } from './environment.js';
import { Static } from '@fastify/type-provider-typebox';
import { ScheduledJobSchema } from './schemas.js';
import { logger } from './logger.js';

async function syncGrouper() {
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
}

async function syncScheduler() {
	const panels = await db.panel.findMany({ select: { id: true } });
	const groups = await db.panelGroup.findMany({ select: { id: true } });
	const targets = [...panels.map((p) => p.id), ...groups.map((g) => g.id)];

	const jobs = await axios.get<Static<typeof ScheduledJobSchema>[]>(
		joinUrl(SCHEDULER_URL, '/jobs'),
	);

	const jobsToDelete = jobs.data.filter((job) => !targets.includes(job.target));

	// no jobs to delete => for our purposes, data are in sync
	if (jobsToDelete.length === 0) {
		return;
	}

	const queryParams = new URLSearchParams();
	jobsToDelete.forEach((job) => queryParams.append('ids', String(job.id)));

	await axios.delete(joinUrl(SCHEDULER_URL, '/jobs'), {
		params: queryParams,
	});
}

export async function sync() {
	const [grouperResult, schedulerResult] = await Promise.allSettled([
		syncGrouper(),
		syncScheduler(),
	]);

	logger.info('Grouper sync result:', grouperResult.status);
	logger.info('Scheduler sync result:', schedulerResult.status);
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
			logger.info('State changed, syncing data with other services...');
			await sync();
			dataToSync = false;
			syncInProgress = false;
			logger.info('Data synced');
		}, ms);
	};

	return {
		stop,
		start,
	};
}

import { parseCronExpression } from 'cron-schedule';
import { connectAsync } from 'mqtt';

import { logger } from '../logger.js';

import { MQTT_URL } from '../environment.js';
import { createDatabaseClient } from '../database.js';

export interface WorkerInput {
	precise: boolean;
}

logger.info(`Loading prisma client`);
const db = createDatabaseClient();
logger.info(`Connecting to MQTT broker at ${MQTT_URL}`);
const mqtt = await connectAsync(MQTT_URL, {
	clientId: 'scheduler_' + Math.random().toString(16).slice(2, 10),
});

export default async function ({ precise }: WorkerInput) {
	const now = new Date();

	const jobs = await db.eInkJob.findMany({
		where: {
			precise,
			disabled: false,
		},
		orderBy: [{ priority: 'desc' }, { target: 'asc' }],
	});

	let lastTarget = '';
	let skip = false;
	for (const job of jobs) {
		if (lastTarget !== job.target) {
			lastTarget = job.target;
			skip = false;
		}

		if (skip) {
			continue;
		}

		const timeMatches = parseCronExpression(job.cron).matchDate(now);

		if (timeMatches) {
			const commandArguments = JSON.parse(job.content);

			if (!Array.isArray(commandArguments)) {
				logger.error(`Command arguments for job ${job.id} are not an array`);
				continue;
			}

			const isEmpty = commandArguments.length === 0;
			if (isEmpty) {
				await mqtt.publishAsync(getTopic(job.target, job.command), '');
				skip = true;
				continue;
			}

			const isCyclable = job.shouldCycle;
			if (isCyclable) {
				await mqtt.publishAsync(
					getTopic(job.target, job.command),
					commandArguments[job.cycle % commandArguments.length],
				);
				await db.eInkJob.update({
					where: { id: job.id },
					data: { cycle: { increment: 1 } },
				});
				skip = true;
				continue;
			}

			// TODO: Find a more universal way to handle this
			await mqtt.publishAsync(getTopic(job.target, job.command), commandArguments[0]);
			skip = true;
		}
	}
}

function getTopic(target: string, command: string): string {
	return `vsb-eink/${target}/${command}`;
}

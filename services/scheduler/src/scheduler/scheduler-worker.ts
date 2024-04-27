import { parseCronExpression } from 'cron-schedule';
import { connectAsync } from 'mqtt';

import { logger } from '../logger.js';

import { MQTT_URL } from '../environment.js';
import { createDatabaseClient } from '../database.js';

export interface WorkerInput {
	precise?: boolean;
}

logger.info(`Loading prisma client`);
const db = createDatabaseClient();
logger.info(`Connecting to MQTT broker at ${MQTT_URL}`);
const mqtt = await connectAsync(MQTT_URL, {
	clientId: 'scheduler_' + Math.random().toString(16).slice(2, 10),
});

export default async function ({ precise }: WorkerInput) {
	const now = new Date();
	now.setMilliseconds(0);

	const jobs = await db.eInkJob.findMany({
		where: {
			precise,
			disabled: false,
		},
		orderBy: [{ precise: 'asc' }, { priority: 'desc' }, { target: 'asc' }],
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

			// invalid job state
			if (!Array.isArray(commandArguments)) {
				logger.error(`Command arguments for job ${job.id} are not an array`);
				continue;
			}

			// jobs without any arguments
			const isEmpty = commandArguments.length === 0;
			if (isEmpty) {
				await mqtt.publishAsync(getTopic(job.target, job.command), '');
				if (job.oneShot) await db.eInkJob.delete({ where: { id: job.id } });
				skip = true;
				continue;
			}

			// cyclable jobs
			const isCyclable = job.shouldCycle;
			if (isCyclable) {
				logger.debug(
					`Publishing ${job.command} for ${job.target} with ${
						commandArguments[0]
					} because ${job.cron} matches ${now.toISOString()}`,
				);
				await mqtt.publishAsync(
					getTopic(job.target, job.command),
					commandArguments[job.cycle % commandArguments.length],
				);

				// for one-shot jobs, delete the job after the last cycle
				if (job.oneShot && job.cycle === commandArguments.length - 1) {
					await db.eInkJob.delete({ where: { id: job.id } });
				} else {
					await db.eInkJob.update({
						where: { id: job.id },
						data: { cycle: { increment: 1 } },
					});
				}
				skip = true;
				continue;
			}

			// TODO: Find a more universal way to handle this
			// jobs with a single argument
			logger.debug(
				`Publishing ${job.command} for ${job.target} with ${commandArguments[0]} because ${
					job.cron
				} matches ${now.toISOString()}`,
			);
			await mqtt.publishAsync(getTopic(job.target, job.command), commandArguments[0]);
			if (job.oneShot) await db.eInkJob.delete({ where: { id: job.id } });
			skip = true;
		}
	}
}

function getTopic(target: string, command: string): string {
	return `vsb-eink/${target}/${command}`;
}

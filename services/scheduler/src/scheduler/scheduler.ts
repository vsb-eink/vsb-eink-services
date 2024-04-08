import { TimerBasedCronScheduler } from 'cron-schedule/schedulers/timer-based.js';
import Piscina from 'piscina';
import { parseCronExpression } from 'cron-schedule';
import { logger } from '../logger.js';
import { WorkerInput } from './scheduler-worker.js';

export interface SchedulerOptions {
	maxWorkers?: number;
	maxQueue?: number;
}

export function createScheduler({ maxWorkers = 4, maxQueue = 1 }: SchedulerOptions = {}) {
	const scheduler = TimerBasedCronScheduler;
	const pool = new Piscina({
		filename: new URL(`scheduler-worker.js`, import.meta.url).href,
		maxQueue,
		maxThreads: maxWorkers,
	});

	const eachSecondCron = parseCronExpression('* * * * * *');
	const eachSecondInterval = scheduler.setInterval(
		eachSecondCron,
		async () => {
			await pool.run({});
		},
		{ errorHandler: (err) => logger.error(err) },
	);

	const stopScheduler = async () => {
		scheduler.clearTimeoutOrInterval(eachSecondInterval);
		await pool.destroy();
	};

	return { scheduler, pool, stopScheduler };
}

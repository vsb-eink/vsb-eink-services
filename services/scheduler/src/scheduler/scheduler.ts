import { TimerBasedCronScheduler } from 'cron-schedule/schedulers/timer-based.js';
import Piscina from 'piscina';
import { parseCronExpression } from 'cron-schedule';
import { logger } from '../logger.js';

export function createScheduler() {
	const scheduler = TimerBasedCronScheduler;
	const pool = new Piscina({
		filename: new URL(`scheduler-worker.js`, import.meta.url).href,
		maxQueue: 1,
		maxThreads: 4,
	});

	const eachMinuteCron = parseCronExpression('* * * * *');
	const eachMinuteInterval = scheduler.setInterval(
		eachMinuteCron,
		async () => {
			await pool.run({ hasSeconds: false });
		},
		{ errorHandler: (err) => logger.error(err) },
	);

	const eachSecondCron = parseCronExpression('* * * * * *');
	const eachSecondInterval = scheduler.setInterval(
		eachSecondCron,
		async () => {
			await pool.run({ hasSeconds: true });
		},
		{ errorHandler: (err) => logger.error(err) },
	);

	const stopScheduler = async () => {
		scheduler.clearTimeoutOrInterval(eachMinuteInterval);
		scheduler.clearTimeoutOrInterval(eachSecondInterval);
		await pool.destroy();
	};

	return { scheduler, pool, stopScheduler };
}

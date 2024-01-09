import { extname } from 'node:path';
import { readFile, constants } from 'node:fs/promises';
import { join as joinPath } from 'node:path';

import { parseCronExpression } from 'cron-schedule';
import { set } from 'date-fns';

import {
	canAccess,
	getLastModifiedDate,
	isHttpUrl,
	joinUrl,
	sleep,
} from './utils.js';
import { logger } from './logger.js';
import {
	EInkJob,
	isEInkJobDisplayFull,
	isEInkJobDisplayPartial,
	loadJobsFromCrontab,
} from './crontab.js';
import { AbstractMessageBroker } from './message-broker.js';
import { CONTENT_PATH, CRONTAB_PATH } from './environment.js';

class EInkSchedulerCore {
	private jobs: EInkJob[] = [];
	private running = false;
	private broker: AbstractMessageBroker;

	constructor({ broker }: { broker: AbstractMessageBroker }) {
		this.broker = broker;
	}

	async loop() {
		this.running = true;

		let lastCrontabModificationTime = new Date(0);

		const jobIterations = new Map<number, number>();
		while (this.running) {
			// check if the crontab file has been modified
			const crontabModificationTime =
				await getLastModifiedDate(CRONTAB_PATH);

			// reload the crontab file if it has been modified
			if (lastCrontabModificationTime < crontabModificationTime) {
				logger.info(`Crontab file changed, reloading`);
				lastCrontabModificationTime = crontabModificationTime;
				await this.loadFromCrontab(CRONTAB_PATH);
				jobIterations.clear();
			}

			// loop through all jobs and execute the ones that are supposed to run right now
			for (let jobIndex = 0; jobIndex < this.jobs.length; jobIndex++) {
				const job = this.jobs[jobIndex];

				// skip jobs that are not supposed to run right now
				const cron = parseCronExpression(job.when);
				const roundedDate = set(new Date(), { seconds: 0 });
				if (!cron.matchDate(roundedDate)) {
					continue;
				}

				logger.info(
					`Executing job ${job.when} ${job.target} ${job.action} ${job.args}`,
				);

				const argumentIndex = jobIterations.get(jobIndex) ?? 0;
				try {
					const { format, mode } = await this.analyseJob(
						job,
						argumentIndex,
					);
					const topic = this.getTopic(job.target, format, mode);

					const buffer =
						format === 'url'
							? job.args[argumentIndex] // plain url as string
							: await readFile(job.args[argumentIndex]); // local file as buffer

					// publish the message
					this.broker
						.publish(topic, Buffer.from(buffer!))
						.catch((error) => logger.error(error));
				} catch (error) {
					logger.error(error);
				} finally {
					// increment the iteration counter
					jobIterations.set(
						jobIndex,
						(argumentIndex + 1) % job.args.length,
					);
				}

				// always go from the first job top down, thus allowing only one job to run at a time
				break;
			}

			// stop the loop if the scheduler is stopped
			if (!this.running) {
				break;
			}

			// sleep for 1 minute
			await sleep({ minutes: 1 });
		}
	}

	async stop() {
		this.running = false;
	}

	async loadFromCrontab(path?: string) {
		const crontabPath = path ?? CRONTAB_PATH;
		this.jobs = await loadJobsFromCrontab(crontabPath!);
	}

	private async analyseJob(job: EInkJob, argumentIndex: number = 0) {
		if (!isEInkJobDisplayFull(job) && !isEInkJobDisplayPartial(job)) {
			throw new Error(`Unsupported action: ${job.action}`);
		}

		const mode = job.action === 'full' ? '4bpp' : '1bpp';

		const path = isHttpUrl(job.args[argumentIndex])
			? job.args[argumentIndex]
			: isHttpUrl(CONTENT_PATH)
			  ? joinUrl(CONTENT_PATH, job.args[argumentIndex])
			  : joinPath(CONTENT_PATH, job.args[argumentIndex]);

		const isURL = isHttpUrl(path);

		const isLocal = await canAccess(
			job.args[argumentIndex],
			constants.R_OK,
		);

		const extension = extname(job.args[argumentIndex]).slice(1);
		const isBinary = isLocal && extension === 'bin';

		let format;
		if (isURL) {
			format = 'url';
		} else if (isBinary) {
			format = 'bin';
		} else if (isLocal) {
			format = extension;
		} else {
			throw new Error(`File not accessible: ${job.args[argumentIndex]}`);
		}

		return { ...job, format, mode };
	}

	private getTopic(target: string, format: string, mode: string): string {
		return `vsb-eink/${target}/display/${format}_${mode}/set`;
	}
}

export { EInkSchedulerCore };

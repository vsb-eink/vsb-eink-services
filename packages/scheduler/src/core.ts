import { extname } from 'node:path';
import { readFile } from 'node:fs/promises';
import { constants } from 'node:fs/promises';

import { parseCronExpression } from 'cron-schedule';
import { set } from 'date-fns';

import {
	EInkJob,
	isEInkJobDisplayFull,
	isEInkJobDisplayPartial,
} from './job.js';
import { canAccess, sleep } from './utils.js';
import { logger } from './logger.js';
import { loadCrontab, saveCrontab } from './crontab.js';
import { AbstractMessageBroker } from './message-broker.js';

class EInkSchedulerCore {
	private env: Record<string, string> = {};
	private jobs: EInkJob[] = [];
	private crontabPath?: string;
	private running = false;
	private broker: AbstractMessageBroker;

	constructor({
		crontabPath,
		broker,
	}: {
		crontabPath?: string;
		broker: AbstractMessageBroker;
	}) {
		this.crontabPath = crontabPath;
		this.broker = broker;
	}

	async getJobs() {
		return this.jobs;
	}

	async getJobById(id: string) {
		return this.jobs.find((job) => job.id === id);
	}

	async setJobs(jobs: EInkJob[], env?: Record<string, string>) {
		this.jobs = jobs;
		if (env) {
			this.env = env;
		}

		await this.commitToCrontab();
	}

	async loop() {
		this.running = true;

		while (this.running) {
			for (const job of this.jobs) {
				// skip jobs that are not supposed to run right now
				if (job.action !== 'full' && job.action !== 'partial') {
					logger.warn(
						`Unsupported action: ${job.action}, skipping`,
					);
					continue;
				}

				// disabled jobs are skipped
				if (job.context.disabled) {
					continue;
				}

				// skip jobs that are not supposed to run right now
				const cron = parseCronExpression(job.when);
				const roundedDate = set(new Date(), { seconds: 0 });
				if (!cron.matchDate(roundedDate)) {
					continue;
				}

				logger.info(
					`Executing job ${job.id} ${job.when} ${job.target} ${job.action} ${job.args}`,
				);

				const argIndex = job.context.iteration % job.args.length;
				const topic = this.calculateTopic(job);

				try {
					let buffer;

					const isURL = ['http://', 'https://'].some((protocol) =>
						job.args[argIndex].startsWith(protocol),
					);
					const isFile = await canAccess(
						job.args[argIndex],
						constants.R_OK,
					);

					if (!isURL && !isFile) {
						logger.error(`Failed to read: ${job.args[argIndex]}`);
						break;
					}

					// read remote file contents
					if (isURL) {
						const response = await fetch(job.args[argIndex]);
						if (!response.ok) {
							logger.error(
								`Failed to fetch ${job.args[argIndex]} due to status ${response.status}`,
							);
							break;
						}
						buffer = await response.arrayBuffer();
					}

					// read local file contents
					if (isFile) {
						buffer = await readFile(job.args[argIndex]);
					}

					// publish the message
					this.broker
						.publish(topic, Buffer.from(buffer!))
						.catch((err) => logger.error(err));
				} catch (err) {
					logger.error(err);
				} finally {
					// increment the iteration counter
					job.context.iteration++;
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
		if (!path && !this.crontabPath) {
			throw new Error('No crontab path provided');
		}

		const crontabPath = path ?? this.crontabPath;
		this.jobs = await loadCrontab(crontabPath!);
	}
	async commitToCrontab(path?: string) {
		if (!path && !this.crontabPath) {
			throw new Error('No crontab path provided');
		}

		const crontabPath = path ?? this.crontabPath;
		return saveCrontab(crontabPath!, this.env, this.jobs);
	}

	private calculateTopic(job: EInkJob) {
		if (!isEInkJobDisplayFull(job) && !isEInkJobDisplayPartial(job)) {
			throw new Error(`Unsupported action: ${job.action}`);
		}

		const argIndex = job.context.iteration % job.args.length;

		const mode = job.action === 'full' ? '4bpp' : '1bpp';

		let format = extname(job.args[argIndex]).slice(1);
		if (format === 'bin') {
			format = 'raw';
		}

		return `vsb-eink/${job.target}/display/${format}_${mode}/set`;
	}
}

export { EInkSchedulerCore };

import { extname } from 'node:path';
import { readFile } from 'fs/promises';
import { constants } from 'node:fs/promises';

import { MqttClient } from 'mqtt';
import { Cron } from 'croner';

import {
	EInkJob,
	isEInkJobDisplayFull,
	isEInkJobDisplayPartial,
} from './job.js';
import { canAccess } from './utils.js';
import { logger } from './logger.js';

export interface EInkScheduleOptions {
	paused?: boolean;
}

class EInkSchedulerCore {
	private jobs: EInkJob[] = [];

	constructor(private mqtt: MqttClient) {}

	async add(job: EInkJob, opts?: EInkScheduleOptions) {
		const index = this.findJobIndex(job);
		if (index !== -1) {
			logger.warn(
				`Job already exists: ${job.when} ${job.target} ${
					job.action
				} ${job.args.join(' ')}`,
			);
			return;
		}

		const topic = this.getTopic(job);

		const cron = new Cron(job.when, { paused: opts?.paused }, async () => {
			logger.info(`Publishing to ${topic}...`);

			if (await canAccess(job.args[0], constants.R_OK)) {
				const buffer = await readFile(job.args[0]);
				await this.mqtt.publishAsync(topic, buffer);
			} else {
				await this.mqtt.publishAsync(topic, job.args[0]);
			}
		});

		job.nativeHandle = cron;
		this.jobs.push(job);
	}
	async addMultiple(jobs: EInkJob[], opts?: EInkScheduleOptions) {
		for (const job of jobs) {
			await this.add(job, opts);
		}
	}

	async remove(job: EInkJob, opts?: EInkScheduleOptions) {
		const index = this.findJobIndex(job);
		if (index < 0) {
			logger.warn(
				`Job not found: ${job.when} ${job.target} ${
					job.action
				} ${job.args.join(' ')}`,
			);
			return;
		}

		const cron = this.jobs[index].nativeHandle;
		cron?.stop();
		this.jobs.splice(index, 1);
	}
	async removeMultiple(jobs: EInkJob[], opts?: EInkScheduleOptions) {
		for (const job of jobs) {
			await this.remove(job, opts);
		}
	}

	async disable(job: EInkJob, opts?: EInkScheduleOptions) {
		const index = this.findJobIndex(job);
		if (index < 0) {
			logger.warn(
				`Job not found: ${job.when} ${job.target} ${
					job.action
				} ${job.args.join(' ')}`,
			);
			return;
		}

		const cron = this.jobs[index].nativeHandle;
		cron?.stop();
	}
	async disableMultiple(jobs: EInkJob[], opts?: EInkScheduleOptions) {
		for (const job of jobs) {
			await this.disable(job, opts);
		}
	}

	async start() {
		for (const job of this.jobs) {
			job.nativeHandle?.resume();
		}
	}
	async close() {
		for (const job of this.jobs) {
			job.nativeHandle?.stop();
		}
		return this.mqtt.endAsync();
	}

	private findJobIndex(job: EInkJob): number {
		for (let i = 0; i < this.jobs.length; i++) {
			const j = this.jobs[i];

			if (j.when != job.when) continue;
			if (j.target != job.target) continue;
			if (j.action != job.action) continue;
			if (JSON.stringify(j.args) != JSON.stringify(job.args)) continue;

			return i;
		}
		return -1;
	}

	private getTopic(job: EInkJob) {
		if (!isEInkJobDisplayFull(job) && !isEInkJobDisplayPartial(job)) {
			throw new Error(`Unsupported action: ${job.action}`);
		}

		const mode = job.action === 'full' ? '4bpp' : '1bpp';
		const type = extname(job.args[0]).slice(1);

		let format = extname(job.args[0]).slice(1);
		if (format === 'bin') {
			format = 'raw';
		}

		return `vsb-eink/${job.target}/display/${format}_${mode}`;
	}
}

export { EInkSchedulerCore };

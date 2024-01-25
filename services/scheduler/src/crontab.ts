import { PathLike } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';

import cronValidate from 'cron-validate';
import { parse as parseCSV, stringify as stringifyCSV } from 'csv/sync';
import { Mutex } from 'async-mutex';
import {logger} from "./logger.js";

export const CONTINUE_KEYWORD = /#continue/;

export enum EInkJobAction {
	DISPLAY_FULL = 'display_full',
	DISPLAY_PARTIAL = 'display_partial',
}

export interface EInkJobContext {
	nonBlocking: boolean;
}

export interface EInkJob {
	when: string;
	target: string;
	action: EInkJobAction;
	args: string[];
	context?: EInkJobContext;
}

export interface EInkJobDisplayFull extends EInkJob {
	action: EInkJobAction.DISPLAY_FULL;
}

export function isEInkJobDisplayFull(job: EInkJob): job is EInkJobDisplayFull {
	return job.action === EInkJobAction.DISPLAY_FULL;
}

export interface EInkJobDisplayPartial extends EInkJob {
	action: EInkJobAction.DISPLAY_PARTIAL;
}

export function isEInkJobDisplayPartial(job: EInkJob): job is EInkJobDisplayPartial {
	return job.action === EInkJobAction.DISPLAY_PARTIAL;
}

export function parseJob(fields: string[]): EInkJob {
	if (fields.length < 7) {
		throw new Error(`Invalid crontab line, not enough fields: ${JSON.stringify(fields)}`);
	}

	const when = fields.slice(0, 5).join(' ');
	const action = fields[5];
	const target = fields[6];
	const arguments_ = fields.slice(7).filter((f) => f !== '');

	// only full and partial actions are supported right now
	if (!Object.values(EInkJobAction).includes(action as never)) {
		throw new Error(`Invalid action: ${action}`);
	}

	// @ts-expect-error workaround for WebStorm reporting cron-validate as not a function
	const isCronValid = cronValidate(when).isValid();
	if (!isCronValid) {
		throw new Error(`Invalid cron expression: ${when}`);
	}

	const job = {
		when,
		target,
		action: action as EInkJobAction,
		args: arguments_,
	};

	return job;
}

const crontabMutex = new Mutex();

export async function readCrontabFile(path: PathLike): Promise<string> {
	return crontabMutex.runExclusive(async () => readFile(path, 'utf8'));
}

export async function writeCrontabFile(path: PathLike, content: string) {
	return crontabMutex.runExclusive(async () => writeFile(path, content));
}

export async function loadJobsFromCrontab(path: string): Promise<EInkJob[]> {
	return crontabMutex.runExclusive(async () => {
		const results = parseCSV(await readFile(path, 'utf8'), {
			columns: false,
			comment: '#',
			delimiter: ' ',
			trim: true,
			raw: true,
			info: true,
			relax_column_count: true,
		});

		const jobs: EInkJob[] = [];
		let continueKeywordFound = false;
		for (const {record, info: metadata} of results) {
			if (CONTINUE_KEYWORD.test(metadata.raw)) {
				continueKeywordFound = true;
			} else if (metadata.raw === '\n') {
				continueKeywordFound = false;
			}

			const job = parseJob(record);

			if (continueKeywordFound) {
				job.context = {
					nonBlocking: true,
				};
			}

			jobs.push(job);
		}

		return jobs;
	});
}

export async function writeJobsToCrontab(path: string, jobs: EInkJob[]) {
	return crontabMutex.runExclusive(async () => {
		let content = '';

		// jobs
		for (const job of jobs) {
			content += stringifyCSV([[job.when, job.target, job.action, ...job.args]]);
		}

		await writeFile(path, content);
	});
}

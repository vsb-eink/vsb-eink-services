import { PathLike } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';

import cronValidate from 'cron-validate';
import { parse as parseCSV, stringify as stringifyCSV } from 'csv/sync';
import { Mutex } from 'async-mutex';

export enum EInkJobAction {
	DISPLAY_FULL = 'full',
	DISPLAY_PARTIAL = 'partial',
}

export interface EInkJob {
	when: string;
	target: string;
	action: EInkJobAction;
	args: string[];
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

export function isEInkJobDisplayPartial(
	job: EInkJob,
): job is EInkJobDisplayPartial {
	return job.action === EInkJobAction.DISPLAY_PARTIAL;
}

export function parseJob(fields: string[]): EInkJob {
	if (fields.length < 7) {
		throw new Error(
			`Invalid crontab line, not enough fields: ${JSON.stringify(
				fields,
			)}`,
		);
	}

	const when = fields.slice(0, 5).join(' ');
	const target = fields[5];
	const action = fields[6];
	const arguments_ = fields.slice(7).filter((f) => f !== '');

	// only full and partial actions are supported right now
	if (!['full', 'partial'].includes(action)) {
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
		const parseResult = parseCSV(await readFile(path, 'utf8'), {
			columns: false,
			comment: '#',
			delimiter: ' ',
			trim: true,
			skip_empty_lines: true,
			skip_records_with_empty_values: true,
		});

		const jobs: EInkJob[] = [];
		for (const fields of parseResult) {
			const job = parseJob(fields);
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
			content += stringifyCSV([
				[job.when, job.target, job.action, ...job.args],
			]);
		}

		await writeFile(path, content);
	});
}

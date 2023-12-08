import { createInterface as createReadlineInterface } from 'node:readline';
import { createReadStream } from 'node:fs';
import { writeFile } from 'fs/promises';

import { parse as parseEnv } from 'dotenv';
import cronValidate from 'cron-validate';
import { parse as parseCSV, stringify as stringifyCSV } from 'csv/sync';
import { Mutex } from 'async-mutex';
import { Adapter } from 'lowdb';
import { TextFile } from 'lowdb/node';

import { EInkJob, EInkJobAction } from './job.js';
import { isEmpty } from './utils.js';
import { logger } from './logger.js';
import { randomUUID } from 'crypto';


export class CrontabFile implements Adapter<>

export function parseCrontabLine(line: string): EInkJob {
	const parseResult = parseCSV(line, {
		columns: false,
		comment: '#',
		delimiter: ' ',
		trim: true,
		skip_empty_lines: true,
		skip_records_with_empty_values: true,
	});

	if (parseResult.length !== 1) {
		throw new Error(`Invalid crontab line, only one field read: ${line}`);
	}

	const fields: string[] = parseResult[0];
	if (fields.length < 7) {
		throw new Error(`Invalid crontab line, not enough fields: ${line}`);
	}

	const when = fields.slice(0, 5).join(' ');
	const target = fields[5];
	const action = fields[6];
	const args = fields.slice(7).filter((f) => f !== '');

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
		context: {
			disabled: false,
			iteration: 0,
		},
		args,
	};

	return job;
}

export async function loadCrontab(path: string): Promise<EInkJob[]> {
	const rl = createReadlineInterface({
		input: createReadStream(path),
	});

	const jobs: EInkJob[] = [];
	let env = {};
	for await (const line of rl) {
		const isComment = line.startsWith('#');
		if (isComment) continue;

		const isEnv = !isEmpty(parseEnv(line));
		if (isEnv) {
			env = { ...env, ...parseEnv(line) };
		}

		const isJob = !isComment && !isEnv;
		if (!isJob) continue;

		try {
			const job = parseCrontabLine(line);
			jobs.push(job);
		} catch (err) {
			logger.error(err);
		}
	}

	return jobs;
}

const crontabMutex = new Mutex();
export async function saveCrontab(
	path: string,
	env: Record<string, string>,
	jobs: EInkJob[],
) {
	return crontabMutex.runExclusive(async () => {
		let content = '';

		// env
		for (const envVar in env) {
			content += `${envVar}=${JSON.stringify(env[envVar])}\n`;
		}

		// jobs
		for (const job of jobs) {
			content += stringifyCSV([
				[job.when, job.target, job.action, ...job.args],
			]);
		}

		await writeFile(path, content);
	});
}

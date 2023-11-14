import { createInterface as createReadlineInterface } from 'node:readline';
import { createReadStream } from 'node:fs';

import { parse as parseEnv } from 'dotenv';
import { Mutex } from 'async-mutex';

import { EInkJob, EInkJobAction } from './job.js';
import { isEmpty } from './utils.js';
import { logger } from './logger.js';

const CRONTAB_LINE_PATTERN = /^(\S+ \S+ \S+ \S+ \S+) (\w+) (\w+) (.+)/;

export function parseCrontabLine(line: string): EInkJob | null {
	const match = line.match(CRONTAB_LINE_PATTERN);
	if (!match) {
		return null;
	}

	const [_, when, target, action, args] = match;

	if (!['full', 'partial'].includes(action)) {
		return null;
	}

	const job = {
		when,
		target,
		action: action as EInkJobAction,
		args: args.split(' '),
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

		const job = parseCrontabLine(line);
		if (!job) {
			logger.warn(`Crontab line in an invalid format: ${line}`);
			continue;
		}
		jobs.push(job);
	}

	return jobs;
}

export async function saveCrontab(path: string, jobs: EInkJob[]) {}

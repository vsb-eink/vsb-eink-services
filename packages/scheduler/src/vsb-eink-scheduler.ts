import { existsSync } from 'node:fs';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { connectAsync } from 'mqtt';

import { EInkSchedulerCore } from './core.js';
import { loadCrontab } from './crontab.js';
import { logger } from './logger.js';

async function main() {
	const argv = yargs(hideBin(process.argv))
		.env('VSB_EINK_SCHEDULER')
		.option('broker-host', {
			describe: 'MQTT broker host',
			type: 'string',
			default: 'localhost',
		})
		.option('crontab', {
			describe: 'Crontab file path',
			type: 'string',
			default: 'eink.cron',
		})
		.help()
		.parseSync();

	logger.info(`Connecting to MQTT broker at ${argv.brokerHost}...`);
	const mqtt = await connectAsync(
		argv.brokerHost.startsWith('mqtt://')
			? argv.brokerHost
			: `mqtt://${argv.brokerHost}`,
	);

	const core = new EInkSchedulerCore(mqtt);

	logger.info(`Loading crontab file at ${argv.crontab}...`);
	if (existsSync(argv.crontab)) {
		const jobs = await loadCrontab(argv.crontab);

		logger.info(`Adding ${jobs.length} jobs...`);
		await core.addMultiple(jobs, { paused: false });
	} else {
		logger.warn(`Crontab file not found at ${argv.crontab}`);
	}

	logger.info(`Starting...`);
	await core.start();
	logger.info(`Started`);
}
main().catch((err) => console.error(err));

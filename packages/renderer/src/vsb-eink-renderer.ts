#!/usr/bin/env node

import { join as joinPath } from 'node:path';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { Browser, chromium } from 'playwright';

import { logger } from './logger.js';
import { createInternalHTTPServer } from './internal-http/index.js';
import { rssPlugin } from './internal-http/plugins/rss.js';
import { fetchPlugin } from './internal-http/plugins/fetch.js';
import { connectAsync } from 'mqtt';
import { EInkRendererCore } from './core.js';
import { MQTTJSMessageBrokerWrapper } from './message-broker.js';

async function cleanup({ browser }: { browser?: Browser | null }) {
	if (browser) {
		logger.info(`Closing browser contexts`);
		await Promise.all(
			browser.contexts().map(async (context) => context.close()),
		);
		logger.info(`Closing browser`);
		await browser.close();
	}
}

async function main() {
	const argv = yargs(hideBin(process.argv))
		.env('VSB_EINK_RENDERER')
		.option('broker-host', {
			describe: 'MQTT broker host',
			type: 'string',
			default: 'localhost',
		})
		.option('internal-http-host', {
			describe: 'Internal HTTP server host',
			type: 'string',
			default: 'localhost',
		})
		.option('internal-http-port', {
			describe: 'Internal HTTP server port',
			type: 'number',
			default: 0,
		})
		.help()
		.parseSync();

	let browser: Browser | null = null;
	try {
		logger.info(`Connecting to MQTT broker at ${argv.brokerHost}`);
		const mqtt = await connectAsync(
			argv.brokerHost.startsWith('mqtt://')
				? `${argv.brokerHost}:${argv.brokerPort}`
				: `mqtt://${argv.brokerHost}:${argv.brokerPort}`,
		);
		logger.info(`Connected to MQTT broker`);

		logger.info(`Loaunching headless browser`);
		browser = await chromium.launch({
			args: ['--disable-lcd-text', '--disable-font-subpixel-positioning', '--unsafely-treat-insecure-origin-as-secure', '--headless=new'],
		});
		logger.info(`Launched headless browser`);

		// register signal handlers
		const signalHandler = async (signal: NodeJS.Signals) => {
			logger.info(`Received ${signal}, shutting down...`);
			if (['SIGINT', 'SIGTERM'].includes(signal)) {
				await cleanup({ browser });
				process.exit(0);
			}
		}
		process.once('SIGINT', signalHandler);
		process.once('SIGTERM', signalHandler);

		logger.info(`Creating internal HTTP server`);
		const internalHTTPServer = await createInternalHTTPServer({
			root: joinPath(process.cwd(), 'internal-public'),
			port: argv.internalHttpPort,
			host: argv.internalHttpHost,
			plugins: [rssPlugin, fetchPlugin],
		});
		logger.info(`Created internal HTTP server`);

		logger.info(`Starting core`);
		const core = new EInkRendererCore({
			browser,
			broker: new MQTTJSMessageBrokerWrapper(mqtt),
			internalHTTPServer,
		});
		await core.run();
	} catch (err) {
		logger.error(err);
	} finally {
		logger.info(`Closing headless browser`);
		await cleanup({ browser });
	}
}
main().catch((err) => logger.error(err));

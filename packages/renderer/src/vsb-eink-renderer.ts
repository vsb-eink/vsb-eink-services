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

async function cleanup({ browser }: { browser?: Browser }) {
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
	let browser: Browser | undefined;
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

		logger.info(`Starting core`);
		const core = new EInkRendererCore({
			browser,
			broker: new MQTTJSMessageBrokerWrapper(mqtt),
		});
		await core.run();
	} catch (error) {
		logger.error(error);
	} finally {
		logger.info(`Closing headless browser`);
		await cleanup({ browser });
	}
}
main().catch((error) => logger.error(error));

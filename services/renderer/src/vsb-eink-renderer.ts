#!/usr/bin/env node

import 'dotenv/config';

import { Browser, chromium } from 'playwright';

import { logger } from './logger.js';
import { connectAsync } from 'mqtt';
import { EInkRendererCore } from './core.js';
import { MQTTJSMessageBrokerWrapper } from './message-broker.js';
import { MQTT_URL } from './environment.js';

async function cleanup({ browser }: { browser?: Browser }) {
	if (browser) {
		logger.info(`Closing browser contexts`);
		await Promise.all(browser.contexts().map(async (context) => context.close()));
		logger.info(`Closing browser`);
		await browser.close();
	}
}

function signalHandler(context: { browser: Browser }) {
	return async (signal: NodeJS.Signals) => {
		logger.info(`Received ${signal}, shutting down...`);
		if (['SIGINT', 'SIGTERM'].includes(signal)) {
			await cleanup({ browser: context.browser });
			process.exit(0);
		}
	};
}

logger.info(`Connecting to MQTT broker at ${MQTT_URL}`);
const mqtt = await connectAsync(MQTT_URL);

logger.info(`Loaunching headless browser`);
const browser = await chromium.launch({
	args: [
		'--disable-lcd-text',
		'--disable-font-subpixel-positioning',
		'--unsafely-treat-insecure-origin-as-secure',
		'--headless=new',
	],
});
process.once('SIGINT', signalHandler({ browser }));
process.once('SIGTERM', signalHandler({ browser }));

logger.info(`Starting core`);
const core = new EInkRendererCore({
	browser,
	broker: new MQTTJSMessageBrokerWrapper(mqtt),
});

// keep the process running
try {
	await core.run();
} finally {
	await cleanup({ browser });
}

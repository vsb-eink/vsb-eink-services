#!/usr/bin/env node

import { existsSync } from 'node:fs';

import { connectAsync } from 'mqtt';
import { matches as topicMatches } from 'mqtt-pattern';
import Fastify from 'fastify';

import { EInkSchedulerCore } from './core.js';
import { logger } from './logger.js';
import { API_HOST, API_PORT, BROKER_HOST, CRONTAB_PATH } from './env.js';

logger.info(`Connecting to MQTT broker at ${BROKER_HOST}`);
const mqtt = await connectAsync(
	!BROKER_HOST.startsWith('mqtt://') ? `mqtt://${BROKER_HOST}` : BROKER_HOST,
);

const core = new EInkSchedulerCore({
	crontabPath: CRONTAB_PATH,
	broker: {
		publish: async (topic, message) => {
			logger.info(`Publishing to ${topic}`);
			await mqtt.publishAsync(topic, message);
		},
		subscribe: async (topic) => {
			logger.info(`Subscribing to ${topic}`);
			await mqtt.subscribeAsync(topic);
		},
		setHandler: async (topic, handler) => {
			logger.info(`Setting MQTT handler`);
			mqtt.on('message', (t, m) => {
				logger.info(`Received message on ${t}`);
				if (topicMatches(topic, t)) {
					handler(t, m);
				}
			});
		},
	},
});

logger.info(`Loading crontab file at ${CRONTAB_PATH}`);
if (existsSync(CRONTAB_PATH)) {
	await core.loadFromCrontab();
} else {
	logger.warn(`Crontab file not found at ${CRONTAB_PATH}`);
}

logger.info(`Setting http api handler`);
const httpServer = Fastify();
await httpServer.listen({
	port: API_PORT,
	host: API_HOST,
	listenTextResolver: (address) => {
		return `Listening on ${address}`;
	},
});

logger.info(`Starting scheduling loop`);
await core.loop();

#!/usr/bin/env node

import 'dotenv/config';

import Fastify from 'fastify';
import FastifySensible from '@fastify/sensible';
import FastifyUnderPressure from '@fastify/under-pressure';
import { connectAsync } from 'mqtt';

import { API_HOST, API_PORT, MQTT_URL } from './env.js';
import { apiRouter } from './routes/index.js';
import { db } from './database.js';

// Subscribe to MQTT topics
const mqtt = await connectAsync(MQTT_URL);
await mqtt.subscribeAsync('vsb-eink/+/display/raw_1bpp/set');
await mqtt.subscribeAsync('vsb-eink/+/display/raw_4bpp/set');

mqtt.on('message', async (topic, message) => {
	const [prefix, target, command, format, ...rest] = topic.split('/');

	const existingGroup = await db.group.findUnique({
		where: { id: target },
		include: { panels: true },
	});
	if (existingGroup === null) {
		return;
	}

	const panelsInGroup = existingGroup.panels ?? [];
	for (const panel of panelsInGroup) {
		await mqtt.publishAsync(`vsb-eink/${panel.id}/display/${format}/set`, message);
	}
});

// Start HTTP server
const httpServer = Fastify({ logger: true });
httpServer.register(FastifyUnderPressure, { exposeStatusRoute: true });
httpServer.register(FastifySensible, { sharedSchemaId: 'HttpError' });
httpServer.register(apiRouter, { prefix: '/' });
await httpServer.listen({
	port: API_PORT,
	host: API_HOST,
	listenTextResolver: (address) => {
		return `Listening on ${address}`;
	},
});

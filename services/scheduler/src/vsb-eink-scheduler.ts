#!/usr/bin/env node

import 'dotenv/config';

import { API_HOST, API_PORT } from './environment.js';

import { logger } from './logger.js';

import { createServer } from './server/server.js';
import { createScheduler } from './scheduler/scheduler.js';

logger.info(`Starting scheduler`);
const { stopScheduler } = createScheduler();

logger.info(`Setting http api handler`);
const httpServer = await createServer({ logger });
await httpServer.listen({
	port: API_PORT,
	host: API_HOST,
	listenTextResolver: (address) => {
		return `Listening on ${address}`;
	},
});

async function cleanUp() {
	logger.info(`Stopping http server`);
	await httpServer.close();

	logger.info(`Stopping scheduler`);
	await stopScheduler();
}

process.on('SIGINT', cleanUp);
process.on('SIGTERM', cleanUp);

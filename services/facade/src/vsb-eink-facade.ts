#!/usr/bin/env node

import 'dotenv/config';

import { createServer } from './server.js';
import { API_HOST, API_PORT } from './environment.js';
import { createSyncWorker } from './sync.js';
import { ensureDatabaseHasAdminSetup } from './database.js';
import { logger } from './logger.js';

const server = createServer({ logger });
const syncWorker = createSyncWorker();

await ensureDatabaseHasAdminSetup();

await server.listen({
	host: API_HOST,
	port: API_PORT,
	listenTextResolver: (address) => {
		return `Listening on ${address}`;
	},
});

syncWorker.start(1000);

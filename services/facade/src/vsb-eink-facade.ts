#!/usr/bin/env node

import 'dotenv/config';

import { createServer } from './server.js';
import { API_HOST, API_PORT } from './environment.js';
import { createSyncWorker } from './sync.js';

const server = createServer({ logger: true });
const syncWorker = createSyncWorker();

await server.listen({
	host: API_HOST,
	port: API_PORT,
	listenTextResolver: (address) => {
		return `Listening on ${address}`;
	},
});

syncWorker.start(1000);

#!/usr/bin/env node

import 'dotenv/config';

import Fastify from 'fastify';
import FastifySensible from '@fastify/sensible';
import FastifyPrintRoutes from 'fastify-print-routes';

import { API_HOST, API_PORT } from './environment.js';
import { coreRoutes } from './routes/core.js';
import { userRoutes } from './routes/user.js';

const app = Fastify({ logger: true });
await app.register(FastifySensible, { sharedSchemaId: 'HttpError' });
await app.register(FastifyPrintRoutes);
await app.register(coreRoutes, { prefix: '/core' });
await app.register(userRoutes, { prefix: '/user' });

await app.listen({
	host: API_HOST,
	port: API_PORT,
	listenTextResolver: (address) => `Listening on ${address}`,
});

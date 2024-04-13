#!/usr/bin/env node

import 'dotenv/config';

import Fastify from 'fastify';
import FastifySensible from '@fastify/sensible';
import FastifyPrintRoutes from 'fastify-print-routes';
import FastifySwagger from '@fastify/swagger';
import FastifySwaggerUI from '@fastify/swagger-ui';
import FastifyUnderPressure from '@fastify/under-pressure';

import { API_HOST, API_PORT } from './environment.js';
import { coreRoutes } from './routes/core.js';
import { userRoutes } from './routes/user.js';

const app = Fastify({ logger: true });
await app.register(FastifyUnderPressure, { exposeStatusRoute: true });
await app.register(FastifySensible, { sharedSchemaId: 'HttpError' });
await app.register(FastifyPrintRoutes);
await app.register(coreRoutes, { prefix: '/core' });
await app.register(userRoutes, { prefix: '/user' });

await app.register(FastifySwagger, {
	openapi: {
		info: {
			title: 'VSB EInk Hoster Service',
			version: '1.0.0',
		},
	},
});
await app.register(FastifySwaggerUI, {
	routePrefix: '/openapi',
});

await app.listen({
	host: API_HOST,
	port: API_PORT,
	listenTextResolver: (address) => `Listening on ${address}`,
});

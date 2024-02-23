import Fastify, { FastifyServerOptions } from 'fastify';
import FastifySensible from '@fastify/sensible';
import FastifyPrintRoutes from 'fastify-print-routes';

import { apiRoutes } from './routes/api/index.js';

export async function createServer(opts?: FastifyServerOptions) {
	const app = await Fastify(opts);

	await app.register(FastifyPrintRoutes, { compact: true });
	await app.register(FastifySensible, { sharedSchemaId: 'HttpError' });

	await app.register(apiRoutes, { prefix: '/' });

	return app;
}

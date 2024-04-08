import Fastify, { FastifyServerOptions, RouteOptions } from 'fastify';
import FastifySensible from '@fastify/sensible';
import FastifyPrintRoutes from 'fastify-print-routes';
import FastifySwagger from '@fastify/swagger';
import FastifySwaggerUI from '@fastify/swagger-ui';

import { apiRoutes } from './routes/api/index.js';

export async function createServer(opts?: FastifyServerOptions) {
	const app = Fastify(opts);

	await app.register(FastifyPrintRoutes, {
		compact: true,
		filter: (route: RouteOptions) => !route.url.startsWith('/openapi'),
	});
	await app.register(FastifySensible, { sharedSchemaId: 'HttpError' });

	await app.register(apiRoutes, { prefix: '/' });

	await app.register(FastifySwagger, {
		openapi: {
			info: {
				title: 'VSB EInk Scheduler Service',
				version: '1.0.0',
			},
		},
	});
	await app.register(FastifySwaggerUI, {
		routePrefix: '/openapi',
	});

	return app;
}

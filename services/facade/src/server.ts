import Fastify, { FastifyServerOptions } from 'fastify';
import FastifySensible from '@fastify/sensible';
import FastifyJWT from '@fastify/jwt';
import FastifyAuth from '@fastify/auth';
import FastifyGuard from 'fastify-guard';
import FastifyCors from '@fastify/cors';
import FastifySwagger from '@fastify/swagger';
import FastifySwaggerUI from '@fastify/swagger-ui';
import FastifyUnderPressure from '@fastify/under-pressure';

import { routes } from './routes/index.js';
import { registerCustomSchemas } from './schemas.js';
import { JWT_SECRET } from './environment.js';

export function createServer(opts?: FastifyServerOptions) {
	const app = Fastify(opts);

	app.register(FastifyUnderPressure, { exposeStatusRoute: { routeOpts: {}, url: '/health' } });

	app.register(FastifySensible, { sharedSchemaId: 'HttpError' });

	app.register(FastifyGuard.default);
	app.register(FastifyJWT, { secret: JWT_SECRET });
	app.register(FastifyAuth);

	app.register(FastifyCors);

	app.register(FastifySwagger, {
		openapi: {
			info: {
				title: 'VSB EInk Facade Service',
				version: '1.0.0',
			},
		},
	});
	app.register(FastifySwaggerUI, {
		routePrefix: '/openapi',
	});

	registerCustomSchemas(app);
	app.register(routes, { prefix: '/' });

	return app;
}

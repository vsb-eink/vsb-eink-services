import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Fastify, { FastifyServerOptions } from 'fastify';
import FastifySensible from '@fastify/sensible';
import FastifyAutoload from '@fastify/autoload';
import FastifyPrintRoutes from 'fastify-print-routes';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function createServer(opts?: FastifyServerOptions) {
	const app = await Fastify(opts);

	await app.register(FastifyPrintRoutes, { compact: true });
	await app.register(FastifySensible, { sharedSchemaId: 'HttpError' });
	await app.register(FastifyAutoload, { dir: join(__dirname, 'routes') });

	return app;
}

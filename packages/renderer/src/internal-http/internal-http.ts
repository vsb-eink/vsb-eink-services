import Fastify, { FastifyPluginAsync } from 'fastify';
import { fastifyStatic } from '@fastify/static';
import { fastifyCors } from '@fastify/cors';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';

import { TypedFastifyInstance } from './types.js';

export interface InternalHTTPServer {
	server: TypedFastifyInstance;
	options: InternalHTTPServerOptions;
}

export interface InternalHTTPServerOptions {
	host?: string;
	port: number;
	root: string;
	plugins: FastifyPluginAsync[];
}

export async function createInternalHTTPServer(options: InternalHTTPServerOptions) {
	const server = Fastify().withTypeProvider<JsonSchemaToTsProvider>();
	const { root } = options;

	await server.register(fastifyStatic, {
		root
	});

	await server.register(fastifyCors);

	for (const plugin of options.plugins) {
		await server.register(plugin);
	}

	return {
		server,
		options
	}
}

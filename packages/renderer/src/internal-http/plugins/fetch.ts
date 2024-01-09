import {
	FastifyPluginAsync
} from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

import { TypedFastifyInstance } from '../types.js';

const plugin: FastifyPluginAsync = async (server: TypedFastifyInstance) => {
	server.get('/fetch', {
		schema: {
			querystring: {
				type: 'object',
				properties: {
					url: {
						type: 'string',
						format: 'uri',
					},
				},
				required: ['url'],
			}
		}
	}, async (request, reply) => {
		const url = request.query.url;
		const response = await fetch(url);

		if (response.headers.has('Content-Type')) {
			reply.header('Content-Type', response.headers.get('Content-Type'));
		}
		reply.code(response.status);
	});
};

export const fetchPlugin = fastifyPlugin(plugin);

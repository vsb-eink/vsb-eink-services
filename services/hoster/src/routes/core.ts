import { RouteShorthandOptions } from 'fastify';
import FastifyReplyFrom from '@fastify/reply-from';
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';

import { extractWildcardParam } from '../utils.js';
import { filesRoutes } from './files.js';

export const coreRoutes: FastifyPluginAsyncTypebox = async (app) => {
	const pingOpts = {
		schema: {
			response: {
				200: Type.Literal('pong'),
			},
		},
	} satisfies RouteShorthandOptions;
	app.get('/ping', pingOpts, () => {
		return 'pong' as const;
	});

	app.register(FastifyReplyFrom, { prefix: '/proxy' });
	app.all('/proxy/*', async (request, reply) => {
		const url = extractWildcardParam(request);

		return reply.from(url);
	});

	app.register(filesRoutes, { prefix: '/files' });
};

import {
	FastifyPluginAsync
} from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';
import { fastifyCaching } from '@fastify/caching';

import { TypedFastifyInstance } from '../types.js';
import rssToJSON from 'rss-to-json';
import { logger } from '../../logger.js';

const { parse: parseRSS } = rssToJSON;

const plugin: FastifyPluginAsync = async (server: TypedFastifyInstance) => {
	server.register(fastifyCaching, {
		privacy: fastifyCaching.privacy.PUBLIC,
		expiresIn: 60 * 5
	});

	server.get('/rss', {
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
		const rss = parseRSS(url);
		logger.debug(`Fetching RSS feed from ${url}`);
		logger.debug(`RSS feed: ${JSON.stringify(rss)}`);
		return rss;
	});
};

export const rssPlugin = fastifyPlugin(plugin);

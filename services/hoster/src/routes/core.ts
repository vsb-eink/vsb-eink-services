import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { filesRoutes } from './files.js';

export const coreRoutes: FastifyPluginAsyncTypebox = async (app) => {
	app.register(filesRoutes, { prefix: '/files' });
};

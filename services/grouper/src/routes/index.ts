import { FastifyPluginAsync } from 'fastify';
import { groupsRoutes } from './groups.js';
import { panelsRoutes } from './panels.js';

export const apiRouter: FastifyPluginAsync = async (app) => {
	app.register(groupsRoutes, { prefix: '/groups' });
	app.register(panelsRoutes, { prefix: '/panels' });
};

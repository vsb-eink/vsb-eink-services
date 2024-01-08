import { FastifyPluginAsync } from 'fastify';
import { crontabRouter } from './routes.js';

export const apiRouter: FastifyPluginAsync = async (app) => {
	app.register(crontabRouter, { prefix: '/crontab' });
};

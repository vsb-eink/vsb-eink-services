import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { jobsRoutes } from './jobs.js';
import { jobRoutes } from './job.js';

export const apiRoutes: FastifyPluginAsyncTypebox = async (app) => {
	app.register(jobsRoutes, { prefix: '/jobs' });
	app.register(jobRoutes, { prefix: '/jobs/:id' });
};

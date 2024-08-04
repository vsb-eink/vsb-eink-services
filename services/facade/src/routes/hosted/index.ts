import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import FastifyHttpProxy from '@fastify/http-proxy';

import { HOSTER_URL } from '../../environment.js';

import { coreFilesRoutes } from "./core-files.js";

export const hostedRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.register(coreFilesRoutes, { prefix: '/core/files' });
	app.register(FastifyHttpProxy, { prefix: '/user', upstream: HOSTER_URL });
};

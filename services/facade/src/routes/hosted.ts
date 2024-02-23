import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import FastifyReplyFrom from '@fastify/reply-from';

import { extractWildcardParam, joinUrl } from '../utils.js';
import { HOSTER_URL } from '../environment.js';
import { Role, Scope } from '../database.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyScope } from '../guards/scope.js';
import { verifyRole } from '../guards/role.js';

export const hostedRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.register(FastifyReplyFrom);

	app.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		url: '/user*',
		handler: async (request, reply) => {
			const path = extractWildcardParam(request);
			return reply.from(joinUrl(HOSTER_URL, '/user', path));
		},
	});

	app.route({
		method: 'GET',
		url: '/core/files*',
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.HOSTED_READ)],
		]),
		handler: async (request, reply) => {
			const path = extractWildcardParam(request);
			return reply.from(joinUrl(HOSTER_URL, '/core/files', path));
		},
	});

	app.route({
		method: ['POST', 'PUT', 'PATCH', 'DELETE'],
		url: '/core/files*',
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.HOSTED_WRITE)],
		]),
		handler: async (request, reply) => {
			const path = extractWildcardParam(request);
			return reply.from(joinUrl(HOSTER_URL, '/core/files', path));
		},
	});
};

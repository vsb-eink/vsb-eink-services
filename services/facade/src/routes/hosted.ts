import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import FastifyHttpProxy from '@fastify/http-proxy';

import { extractWildcardParam, joinUrl } from '../utils.js';
import { HOSTER_URL } from '../environment.js';
import { Role, Scope } from '../database.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyScope } from '../guards/scope.js';
import { verifyRole } from '../guards/role.js';
import FastifyReplyFrom from '@fastify/reply-from';

export const hostedRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.register(FastifyHttpProxy, {
		upstream: HOSTER_URL,
		httpMethods: ['GET'],
		preHandler: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.HOSTED_WRITE)],
		]),
	});

	app.register(FastifyHttpProxy, {
		upstream: HOSTER_URL,
		httpMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
		preHandler: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.HOSTED_WRITE)],
		]),
	});

	app.register(FastifyReplyFrom, { prefix: '/user' });
	app.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		url: '/user*',
		handler: async (request, reply) => {
			const path = extractWildcardParam(request);
			return reply.from(joinUrl(HOSTER_URL, '/user', path));
		},
	});
};

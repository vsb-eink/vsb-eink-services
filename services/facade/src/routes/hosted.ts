import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import FastifyHttpProxy from '@fastify/http-proxy';

import { joinUrl } from '../utils.js';
import { HOSTER_URL } from '../environment.js';
import { Role, Scope } from '../database.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyScope } from '../guards/scope.js';
import { verifyRole } from '../guards/role.js';
import FastifyReplyFrom from '@fastify/reply-from';

export const hostedRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.register(FastifyHttpProxy, {
		httpMethods: ['GET'],
		prefix: '/core',
		upstream: joinUrl(HOSTER_URL, '/core'),
		preHandler: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.HOSTED_READ)],
		]),
	});

	app.register(FastifyHttpProxy, {
		httpMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
		prefix: '/core',
		upstream: joinUrl(HOSTER_URL, '/core'),
		preHandler: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.HOSTED_WRITE)],
		]),
	});

	app.register(FastifyReplyFrom, { prefix: '/user' });
	app.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		url: '/user*',
		schema: {
			params: Type.Object({
				'*': Type.String(),
			}),
		},
		handler: async (request, reply) => {
			const path = request.params['*'];
			if (path && !path.startsWith('/')) {
				return reply.notFound();
			}
			return reply.from(joinUrl(HOSTER_URL, '/user', path));
		},
	});
};

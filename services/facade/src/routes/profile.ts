import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { verifyJWT } from '../guards/jwt.js';
import { db } from '../database.js';

export const profileRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.route({
		method: 'GET',
		url: '/',
		onRequest: app.auth([verifyJWT]),
		handler: async (request, reply) => {
			const user = await db.user.findUnique({
				where: {
					id: request.user.id,
				},
				include: {
					groups: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			if (!user) {
				return reply.unauthorized();
			}

			return {
				id: user.id,
				username: user.username,
				role: user.role,
				groups: user.groups,
				scopes: request.user.scopes,
			};
		},
	});
};

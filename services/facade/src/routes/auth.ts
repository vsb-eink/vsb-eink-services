import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import argon2 from 'argon2';

import { db, Scope } from '../database.js';

export const authRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.route({
		method: 'POST',
		url: '/login',
		schema: {
			body: Type.Object({
				username: Type.String(),
				password: Type.String(),
			}),
		},
		handler: async (request, reply) => {
			const user = await db.user.findUnique({
				where: { username: request.body.username },
				include: { groups: { include: { managedPanelGroups: true } } },
			});
			if (!user) {
				return reply.forbidden('Invalid username or password');
			}

			const passwordIsValid = await argon2.verify(user.password, request.body.password);
			if (!passwordIsValid) {
				return reply.forbidden('Invalid username or password');
			}

			const token = await reply.jwtSign(
				{ id: user.id, role: user.role },
				{ expiresIn: '30d' },
			);

			return {
				token,
			};
		},
	});
};

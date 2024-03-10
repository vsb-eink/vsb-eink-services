import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { Role } from '../database.js';
import { verifyRole } from '../guards/role.js';
import { verifyJWT } from '../guards/jwt.js';
import { sync } from '../sync.js';

export const maintenanceRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.route({
		method: 'POST',
		url: '/sync',
		onRequest: app.auth([verifyJWT, verifyRole(Role.ADMIN)], { relation: 'and' }),
		handler: async (request, reply) => {
			try {
				await sync();
				return { success: true };
			} catch (e) {
				app.log.error(e);
				return reply.internalServerError();
			}
		},
	});
};

import { onRequestHookHandler } from 'fastify';
import { db, Role } from '../database.js';

export const verifyRole: (role: Role) => onRequestHookHandler = (role: Role) => {
	return async (request, reply) => {
		if (request.user.role !== role) {
			return reply.forbidden();
		}
	};
};

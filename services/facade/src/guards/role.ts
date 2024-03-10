import { onRequestHookHandler } from 'fastify';
import { Role } from '../database.js';
import { httpErrors } from '@fastify/sensible';

export const verifyRole: (role: Role) => onRequestHookHandler = (role: Role) => {
	return async (request, reply) => {
		if (request.user.role !== role) {
			throw httpErrors.forbidden();
		}
	};
};

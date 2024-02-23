import { db, Scope } from '../database.js';
import { onRequestHookHandler } from 'fastify';

export const verifyScope: (...scope: Scope[]) => onRequestHookHandler = (...scopes: Scope[]) => {
	return async (request, reply) => {
		if (scopes.length === 0) {
			throw new Error('verifyScope needs at least one scope!');
		}

		if (!request.user.scopes.some((scope) => scopes.includes(scope))) {
			return reply.forbidden();
		}
	};
};

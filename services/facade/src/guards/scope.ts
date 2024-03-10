import { Scope } from '../database.js';
import { onRequestHookHandler } from 'fastify';
import { httpErrors } from '@fastify/sensible';

export const verifyScope: (...scope: Scope[]) => onRequestHookHandler = (...scopes: Scope[]) => {
	return async (request, reply) => {
		if (scopes.length === 0) {
			throw httpErrors.internalServerError('verifyScope needs at least one scope!');
		}

		if (!request.user.scopes.some((scope) => scopes.includes(scope))) {
			throw httpErrors.forbidden();
		}
	};
};

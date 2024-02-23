import { onRequestHookHandler } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

import { db } from '../database.js';
import { Scope } from '@prisma/facade-client';

const AccessTokenPayload = Type.Object({
	id: Type.Number(),
	iat: Type.Number(),
	exp: Type.Number(),
});

const AccessTokenPayloadCompiler = TypeCompiler.Compile(AccessTokenPayload);

export const verifyJWT: onRequestHookHandler = async (request, reply) => {
	// If the user is already set, we don't need to verify the JWT
	if (request.user) {
		return;
	}

	try {
		const token = await request.jwtVerify();

		if (!AccessTokenPayloadCompiler.Check(token)) {
			return reply.unauthorized();
		}

		const user = await db.user.findUnique({
			where: { id: token.id },
			include: { groups: { select: { scopes: true } } },
		});

		if (!user) {
			return reply.unauthorized();
		}

		const scopes = new Set(user.groups.flatMap((group) => group.scopes));

		if (user.role === 'ADMIN') {
			Object.values(Scope).forEach(scopes.add, scopes);
		}

		request.user = request.user = {
			id: user.id,
			username: user.username,
			role: user.role,
			scopes: [...scopes],
		};
	} catch (err) {
		request.log.error(err);
		return reply.unauthorized();
	}
};

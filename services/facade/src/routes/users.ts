import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import argon2 from 'argon2';

import { Role, Scope, db, isNotFoundError } from '../database.js';
import {
	EmptyBodySchema,
	HttpErrorSchema,
	InsertableUserSchema,
	UpdatableUserSchema,
	UserSchema,
} from '../schemas.js';
import { verifyScope } from '../guards/scope.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyRole } from '../guards/role.js';
import { verifyProfileOwner } from '../guards/owner.js';

export const usersRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.route({
		method: 'GET',
		url: '/',
		schema: {
			response: {
				200: Type.Array(UserSchema),
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.USERS_READ)],
		]),
		handler: async (request, reply) => {
			return db.user.findMany({
				include: {
					groups: {
						select: { id: true, name: true },
					},
				},
			});
		},
	});

	app.route({
		method: 'POST',
		url: '/',
		schema: {
			body: InsertableUserSchema,
			response: {
				201: UserSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.USERS_WRITE)],
		]),
		handler: async (request, reply) => {
			if (request.body.role === Role.ADMIN && request.user.role !== Role.ADMIN) {
				return reply.forbidden('Only admins can create admin users');
			}

			const hashedPassword = await argon2.hash(request.body.password);
			return await db.user.create({
				data: {
					username: request.body.username,
					password: hashedPassword,
					role: request.body.role,
					groups: { connect: request.body.groups?.map(({ id }) => ({ id })) },
				},
				include: {
					groups: {
						select: { id: true, name: true },
					},
				},
			});
		},
	});

	/** single user routes */
	const UserPathParamsSchema = Type.Object({ userId: Type.Number() });

	app.route({
		method: 'GET',
		url: '/:userId',
		schema: {
			params: UserPathParamsSchema,
			response: {
				200: UserSchema,
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.USERS_READ)],
			[verifyJWT, verifyProfileOwner],
		]),
		handler: async (request, reply) => {
			const user = await db.user.findUnique({
				where: { id: request.params.userId },
				include: {
					groups: {
						select: { id: true, name: true },
					},
				},
			});
			if (!user) {
				return reply.notFound();
			}
			return user;
		},
	});

	app.route({
		method: 'PATCH',
		url: '/:userId',
		schema: {
			params: UserPathParamsSchema,
			body: UpdatableUserSchema,
			response: {
				200: UserSchema,
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.USERS_WRITE)],
			[verifyJWT, verifyProfileOwner],
		]),
		handler: async (request, reply) => {
			try {
				if (
					request.user.role !== Role.ADMIN &&
					request.body.groups &&
					!request.user.scopes.includes(Scope.USERS_WRITE)
				) {
					return reply.forbidden();
				}

				if (request.body.role === Role.ADMIN && request.user.role !== Role.ADMIN) {
					return reply.forbidden('Only admins can update user roles');
				}

				if (request.body.password && ((request.user.role !== Role.ADMIN) && (request.user.id !== request.params.userId))) {
					return reply.forbidden('Only admins can update other user\'s passwords');
				}

				const newHashedPassword = request.body.password
					? await argon2.hash(request.body.password)
					: undefined;

				return await db.user.update({
					where: { id: request.params.userId },
					data: {
						username: request.body.username,
						role: request.body.role,
						password: newHashedPassword,
						groups: request.body.groups ? { set: request.body.groups } : undefined,
					},
					include: {
						groups: {
							select: { id: true, name: true },
						},
					},
				});
			} catch (error) {
				if (isNotFoundError(error)) {
					return reply.notFound();
				}
				throw error;
			}
		},
	});

	app.route({
		method: 'DELETE',
		url: '/:userId',
		schema: {
			params: UserPathParamsSchema,
			response: {
				204: EmptyBodySchema,
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.USERS_WRITE)],
			[verifyJWT, verifyProfileOwner],
		]),
		handler: async (request, reply) => {
			try {
				await db.user.delete({ where: { id: request.params.userId } });
				reply.status(204);
			} catch (error) {
				if (isNotFoundError(error)) {
					return reply.notFound();
				}
				throw error;
			}
		},
	});
};

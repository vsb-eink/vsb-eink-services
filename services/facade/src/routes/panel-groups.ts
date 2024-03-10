import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';

import { verifyJWT } from '../guards/jwt.js';
import {
	EmptyBodySchema,
	HttpErrorSchema,
	InsertablePanelGroupSchema,
	PanelGroupSchema,
	UpdatablePanelGroupSchema,
} from '../schemas.js';
import { db, isNotFoundError, Role, Scope } from '../database.js';
import { verifyScope } from '../guards/scope.js';
import { verifyRole } from '../guards/role.js';
import { verifyAccessToPanelGroup } from '../guards/owner.js';

export const panelGroupsRoutes: FastifyPluginAsyncTypebox = async (app) => {
	app.route({
		url: '/',
		method: 'GET',
		schema: {
			response: {
				200: Type.Array(PanelGroupSchema),
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_READ)],
		]),
		handler: async (request, reply) => {
			if (request.user.role === Role.ADMIN) {
				return db.panelGroup.findMany({
					include: { panels: true, managedBy: true },
				});
			}

			return db.panelGroup.findMany({
				where: {
					managedBy: { some: { users: { some: { id: request.user.id } } } },
				},
				include: {
					panels: true,
					managedBy: {
						select: { id: true, name: true },
					},
				},
			});
		},
	});

	app.route({
		url: '/',
		method: 'POST',
		schema: {
			body: InsertablePanelGroupSchema,
			response: {
				201: PanelGroupSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_WRITE)],
		]),
		handler: async (request, reply) => {
			if (request.body.managedBy && !request.user.scopes.includes(Scope.USERS_WRITE)) {
				return reply.forbidden();
			}

			reply.statusCode = 201;
			return db.panelGroup.create({
				data: {
					id: request.body.id,
					name: request.body.name ?? request.body.id,
					panels: { connect: request.body.panels?.map(({ id }) => ({ id })) },
					managedBy: { connect: request.body.managedBy?.map(({ id }) => ({ id })) },
				},
				include: {
					panels: true,
					managedBy: {
						select: { id: true, name: true },
					},
				},
			});
		},
	});

	const PanelGroupParams = Type.Object({ panelGroupId: Type.String() });

	app.route({
		url: '/:panelGroupId',
		method: 'GET',
		schema: {
			params: PanelGroupParams,
			response: {
				200: PanelGroupSchema,
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_READ), verifyAccessToPanelGroup],
		]),
		handler: async (request, reply) => {
			const group = db.panelGroup.findUnique({
				where: { id: request.params.panelGroupId },
				include: {
					panels: true,
					managedBy: {
						select: { id: true, name: true },
					},
				},
			});

			if (!group) {
				return reply.notFound();
			}

			return group;
		},
	});

	app.route({
		url: '/:panelGroupId',
		method: 'PATCH',
		schema: {
			body: UpdatablePanelGroupSchema,
			params: PanelGroupParams,
			response: {
				200: PanelGroupSchema,
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_WRITE), verifyAccessToPanelGroup],
		]),
		handler: async (request, reply) => {
			try {
				if (
					request.user.role !== Role.ADMIN &&
					request.body.managedBy &&
					!request.user.scopes.includes(Scope.USERS_WRITE)
				) {
					return reply.forbidden();
				}

				const group = await db.panelGroup.update({
					where: { id: request.params.panelGroupId },
					data: {
						id: request.body.id,
						name: request.body.name,
						panels: { set: request.body.panels?.map(({ id }) => ({ id })) },
						managedBy: { set: request.body.managedBy?.map(({ id }) => ({ id })) },
					},
					include: {
						panels: true,
						managedBy: {
							select: { id: true, name: true },
						},
					},
				});

				return group;
			} catch (error) {
				if (isNotFoundError(error)) {
					return reply.notFound();
				}
				throw error;
			}
		},
	});

	app.route({
		url: '/:panelGroupId',
		method: 'DELETE',
		schema: {
			params: PanelGroupParams,
			response: {
				204: EmptyBodySchema,
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_WRITE), verifyAccessToPanelGroup],
		]),
		handler: async (request, reply) => {
			try {
				await db.panelGroup.delete({ where: { id: request.params.panelGroupId } });
			} catch (error) {
				if (isNotFoundError(error)) {
					return reply.notFound();
				}
				throw error;
			}
		},
	});
};

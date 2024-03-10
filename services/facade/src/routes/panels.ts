import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';

import { verifyJWT } from '../guards/jwt.js';
import { Role, Scope, db, isNotFoundError } from '../database.js';
import { verifyScope } from '../guards/scope.js';
import { verifyRole } from '../guards/role.js';
import {
	HttpErrorSchema,
	InsertablePanelSchema,
	PanelSchema,
	registerCustomSchemas,
	UpdatablePanelSchema,
} from '../schemas.js';
import { verifyAccessToPanel } from '../guards/owner.js';

export const panelsRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.route({
		url: '/',
		method: 'GET',
		schema: {
			response: {
				200: Type.Array(Type.Ref(PanelSchema)),
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_READ)],
		]),
		handler: async (request, reply) => {
			if (request.user.role === Role.ADMIN) {
				return db.panel.findMany({ include: { groups: true } });
			}

			return db.panel.findMany({
				where: {
					groups: {
						some: { managedBy: { some: { users: { some: { id: request.user.id } } } } },
					},
				},
				include: { groups: true },
			});
		},
	});

	app.route({
		url: '/',
		method: 'POST',
		schema: {
			body: InsertablePanelSchema,
			response: {
				201: PanelSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_WRITE)],
		]),
		handler: async (request, reply) => {
			reply.statusCode = 201;
			return db.panel.create({
				data: {
					id: request.body.id,
					name: request.body.name ?? request.body.id,
					groups: { connect: request.body.groups?.map(({ id }) => ({ id })) },
				},
				include: { groups: true },
			});
		},
	});

	const PanelPathParamsSchema = Type.Object({ panelId: Type.String() });
	app.route({
		url: '/:panelId',
		method: 'GET',
		schema: {
			params: PanelPathParamsSchema,
			response: {
				200: PanelSchema,
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_READ), verifyAccessToPanel],
		]),
		handler: async (request, reply) => {
			const panel = db.panel.findUnique({
				where: { id: request.params.panelId },
				include: { groups: true },
			});

			if (!panel) {
				return reply.notFound();
			}

			return panel;
		},
	});

	app.route({
		url: '/:panelId',
		method: 'PATCH',
		schema: {
			params: PanelPathParamsSchema,
			body: UpdatablePanelSchema,
			response: {
				200: PanelSchema,
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_WRITE), verifyAccessToPanel],
		]),
		handler: async (request, reply) => {
			try {
				const panel = db.panel.update({
					where: { id: request.params.panelId },
					data: {
						id: request.body.id,
						name: request.body.name,
						groups: { set: request.body.groups?.map(({ id }) => ({ id })) },
					},
					include: { groups: true },
				});

				return panel;
			} catch (error) {
				if (isNotFoundError(error)) {
					return reply.notFound();
				}
				throw error;
			}
		},
	});

	app.route({
		url: '/:panelId',
		method: 'DELETE',
		schema: {
			params: PanelPathParamsSchema,
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.PANELS_WRITE), verifyAccessToPanel],
		]),
		handler: async (request, reply) => {
			try {
				await db.panel.delete({ where: { id: request.params.panelId } });
			} catch (error) {
				if (isNotFoundError(error)) {
					return reply.notFound();
				}
				throw error;
			}
		},
	});
};

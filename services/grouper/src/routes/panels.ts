import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import {
	EmptyBodySchema,
	HttpErrorSchema,
	InsertablePanelSchema,
	PanelSchema,
	UpdatablePanelSchema,
} from './schemas.js';
import { db, Prisma } from '../database.js';

export const panelsRoutes: FastifyPluginAsyncTypebox = async (app) => {
	const PanelQuerySchema = Type.Object({
		ids: Type.Optional(Type.Array(Type.String())),
		groups: Type.Optional(Type.Array(Type.String())),
	});

	app.route({
		method: 'GET',
		url: '/',
		schema: {
			querystring: PanelQuerySchema,
			response: {
				200: Type.Array(PanelSchema),
			},
		},
		handler: async (request) => {
			let where = {};
			if (request.query.ids) {
				where = { ...where, id: { in: request.query.ids } };
			}
			if (request.query.groups) {
				where = { groups: { some: { id: { in: request.query.groups } } } };
			}

			return db.panel.findMany({
				where,
				include: { groups: true },
			});
		},
	});

	app.route({
		method: 'PUT',
		url: '/',
		schema: {
			body: Type.Array(InsertablePanelSchema),
			response: {
				204: EmptyBodySchema,
			},
		},
		handler: async (request, reply) => {
			await db.$transaction(async (tx) => {
				await tx.panel.deleteMany({});

				for (const panel of request.body) {
					await tx.panel.create({
						data: {
							id: panel.id,
							name: panel.name,
							groups: {
								connectOrCreate: panel.groups?.map((group) => ({
									where: { id: group.id },
									create: group,
								})),
							},
						},
						include: { groups: true },
					});
				}
			});

			reply.statusCode = 204;
		},
	});

	app.route({
		method: 'POST',
		url: '/',
		schema: {
			body: InsertablePanelSchema,
			response: {
				201: PanelSchema,
			},
		},
		handler: async (request) => {
			return db.panel.create({
				data: {
					id: request.body.id,
					name: request.body.name,
					groups: {
						connectOrCreate: request.body.groups?.map((group) => ({
							where: { id: group.id },
							create: group,
						})),
					},
				},
				include: { groups: true },
			});
		},
	});

	/** single panel routes */
	const PanelPathParamsSchema = Type.Object({ id: PanelSchema.id });

	app.route({
		method: 'GET',
		url: '/:id',
		schema: {
			params: PanelPathParamsSchema,
			response: {
				200: PanelSchema,
				404: HttpErrorSchema,
			},
		},
		handler: async (request, reply) => {
			const panel = await db.panel.findUnique({
				where: { id: request.params.id },
				include: { groups: true },
			});

			if (panel === null) {
				return reply.notFound();
			}

			return panel;
		},
	});

	app.route({
		method: 'PATCH',
		url: '/:id',
		schema: {
			params: PanelPathParamsSchema,
			body: UpdatablePanelSchema,
			response: {
				200: PanelSchema,
				404: HttpErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				if (!request.body.id && !request.body.groups) {
					return reply.badRequest('At least one field must be provided');
				}

				return await db.$transaction(async (tx) => {
					if (request.body.id) {
						await tx.panel.update({
							where: { id: request.params.id },
							data: { id: request.body.id },
						});
					}

					if (request.body.name) {
						await tx.panel.update({
							where: { id: request.params.id },
							data: { name: request.body.name },
						});
					}

					if (request.body.groups) {
						await tx.panel.update({
							where: { id: request.body.id ?? request.params.id },
							data: {
								groups: {
									set: [],
									connectOrCreate: request.body.groups?.map((group) => ({
										where: { id: group.id },
										create: group,
									})),
								},
							},
						});
					}

					return tx.panel.findUnique({
						where: { id: request.body.id ?? request.params.id },
						include: { groups: true },
					});
				});
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2025'
				) {
					return reply.notFound();
				}
				throw error;
			}
		},
	});

	app.route({
		method: 'DELETE',
		url: '/:id',
		schema: {
			params: PanelPathParamsSchema,
			response: {
				204: EmptyBodySchema,
				404: HttpErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				await db.panel.delete({
					where: { id: request.params.id },
				});
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2025'
				) {
					return reply.notFound();
				}
				throw error;
			}
		},
	});
};

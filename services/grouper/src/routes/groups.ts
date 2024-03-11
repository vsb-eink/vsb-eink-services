import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { Prisma, db, Panel } from '../database.js';
import {
	EmptyBodySchema,
	GroupSchema,
	HttpErrorSchema,
	InsertableGroupSchema,
	UpdatableGroupSchema,
} from './schemas.js';

export const groupsRoutes: FastifyPluginAsyncTypebox = async (app) => {
	const GroupQuerySchema = Type.Object({
		ids: Type.Optional(Type.Array(Type.String())),
		panels: Type.Optional(Type.Array(Type.String())),
	});

	app.route({
		method: 'GET',
		url: '/',
		schema: {
			querystring: GroupQuerySchema,
			response: {
				200: Type.Array(GroupSchema),
			},
		},
		handler: async (request) => {
			let where = {};
			if (request.query.ids) {
				where = { ...where, id: { in: request.query.ids } };
			}
			if (request.query.panels) {
				where = { ...where, panels: { some: { id: { in: request.query.panels } } } };
			}

			return db.group.findMany({
				where,
				include: { panels: true },
			});
		},
	});

	app.route({
		method: 'PUT',
		url: '/',
		schema: {
			body: Type.Array(InsertableGroupSchema),
			response: {
				204: EmptyBodySchema,
			},
		},
		handler: async (request, reply) => {
			await db.$transaction(async (tx) => {
				await tx.group.deleteMany({});

				for (const group of request.body) {
					await tx.group.create({
						data: {
							id: group.id,
							name: group.name,
							panels: {
								connectOrCreate: group.panels?.map((panel) => ({
									where: { id: panel.id },
									create: panel,
								})),
							},
						},
						include: { panels: true },
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
			body: InsertableGroupSchema,
			response: {
				201: GroupSchema,
			},
		},
		handler: async (request) => {
			return db.group.create({
				data: {
					id: request.body.id,
					name: request.body.name,
					panels: {
						connectOrCreate: request.body.panels?.map((panel) => ({
							where: { id: panel.id },
							create: panel,
						})),
					},
				},
				include: { panels: true },
			});
		},
	});

	/** single group routes */
	const GroupPathParamsSchema = Type.Object({ id: GroupSchema.id });

	app.route({
		method: 'GET',
		url: '/:id',
		schema: {
			params: GroupPathParamsSchema,
			response: {
				200: GroupSchema,
				404: HttpErrorSchema,
			},
		},
		handler: async (request, reply) => {
			const group = await db.group.findUnique({
				where: { id: request.params.id },
				include: { panels: true },
			});

			if (group === null) {
				return reply.notFound();
			}

			return group;
		},
	});

	app.route({
		method: 'PATCH',
		url: '/:id',
		schema: {
			params: GroupPathParamsSchema,
			body: UpdatableGroupSchema,
			response: {
				200: GroupSchema,
				404: HttpErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				if (!request.body.id && !request.body.panels) {
					return reply.badRequest('At least one field must be provided');
				}

				return await db.$transaction(async (tx) => {
					if (request.body.id) {
						await tx.group.update({
							where: { id: request.params.id },
							data: { id: request.body.id },
						});
					}

					if (request.body.name) {
						await tx.group.update({
							where: { id: request.params.id },
							data: { name: request.body.name },
						});
					}

					if (request.body.panels) {
						await tx.group.update({
							where: { id: request.body.id ?? request.params.id },
							data: {
								panels: {
									set: [],
									connectOrCreate: request.body.panels.map((panel) => ({
										where: { id: panel.id },
										create: panel,
									})),
								},
							},
						});
					}

					return await tx.group.findUnique({
						where: { id: request.body.id ?? request.params.id },
						include: { panels: true },
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
			params: GroupPathParamsSchema,
			response: {
				204: EmptyBodySchema,
				404: HttpErrorSchema,
			},
		},
		handler: async (request, reply) => {
			try {
				await db.group.delete({
					where: { id: request.params.id },
				});
				reply.statusCode = 204;
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

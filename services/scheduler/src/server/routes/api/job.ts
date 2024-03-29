import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { RouteShorthandOptions } from 'fastify';

import {
	EInkJobParamsSchema,
	EInkJobSelectableSchema,
	EInkJobUpdatableSchema,
	EmptyBodySchema,
	HttpErrorSchema,
} from '../../schemas.js';
import { db, Prisma } from '../../../database.js';
import { isValidCron, isValidCronWithSeconds } from '../../../cron-utils.js';

export const jobRoutes: FastifyPluginAsyncTypebox = async (app) => {
	const getJobOpts = {
		schema: {
			params: EInkJobParamsSchema,
			response: {
				200: EInkJobSelectableSchema,
				404: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.get('/', getJobOpts, async (req, reply) => {
		const job = await db.eInkJob.findUnique({
			where: { id: req.params.id },
		});

		if (job === null) {
			return reply.notFound();
		}

		return {
			...job,
			content: JSON.parse(job.content),
		};
	});

	const updateJobOpts = {
		schema: {
			params: EInkJobParamsSchema,
			body: EInkJobUpdatableSchema,
			response: {
				200: EInkJobSelectableSchema,
				404: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.patch('/', updateJobOpts, async (req, reply) => {
		try {
			if (req.body.cron && !isValidCron(req.body.cron)) {
				return reply.badRequest('Invalid cron expression');
			}

			const job = await db.eInkJob.update({
				where: { id: req.params.id },
				data: {
					...req.body,
					content: JSON.stringify(req.body.content),
					precise: req.body.cron ? isValidCronWithSeconds(req.body.cron) : undefined,
				},
			});

			return {
				...job,
				content: JSON.parse(job.content),
			};
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return reply.notFound();
			}

			throw error;
		}
	});

	const deleteJobOpts = {
		schema: {
			params: EInkJobParamsSchema,
			response: {
				204: EmptyBodySchema,
				404: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.delete('/', deleteJobOpts, async (req, reply) => {
		try {
			await db.eInkJob.delete({
				where: { id: req.params.id },
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return reply.notFound();
			}

			throw error;
		}
	});
};

import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { RouteShorthandOptions } from 'fastify';

import {
	EInkJobBulkUpdatableSchema,
	EInkJobInsertableSchema,
	EInkJobQuerySchema,
	EInkJobSelectableSchema,
	EmptyBodySchema,
} from '../../schemas.js';
import { db } from '../../../database.js';
import { isValidCron, isValidCronWithSeconds } from '../../../cron-utils.js';

export const jobsRoutes: FastifyPluginAsyncTypebox = async (app) => {
	const getJobsOpts = {
		schema: {
			response: {
				200: Type.Array(EInkJobSelectableSchema),
			},
			querystring: EInkJobQuerySchema,
		},
	} satisfies RouteShorthandOptions;
	app.get('/', getJobsOpts, async (req) => {
		const jobs = await db.eInkJob.findMany({
			where: req.query,
		});

		return jobs.map((job) => ({
			...job,
			content: JSON.parse(job.content),
		}));
	});

	const createJobOpts = {
		schema: {
			body: EInkJobInsertableSchema,
			response: {
				201: EInkJobSelectableSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.post('/', createJobOpts, async (req, reply) => {
		if (req.body.cron && !isValidCron(req.body.cron)) {
			return reply.badRequest('Invalid cron expression');
		}

		const job = await db.eInkJob.create({
			data: {
				...req.body,
				precise: isValidCronWithSeconds(req.body.cron),
				content: JSON.stringify(req.body.content),
			},
		});

		reply.statusCode = 201;

		return {
			...job,
			content: JSON.parse(job.content),
		};
	});

	const deleteJobsOpts = {
		schema: {
			response: {
				204: EmptyBodySchema,
			},
			querystring: Type.Object({
				ids: Type.Array(Type.Integer()),
			}),
		},
	} satisfies RouteShorthandOptions;
	app.delete('/', deleteJobsOpts, async (req, reply) => {
		const { ids } = req.query;
		await db.eInkJob.deleteMany({ where: { id: { in: ids } } });
	});

	const updateJobsOpts = {
		schema: {
			body: EInkJobBulkUpdatableSchema,
			response: {
				204: EmptyBodySchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.patch('/', updateJobsOpts, async (req, reply) => {
		await db.$transaction(async (tx) => {
			for (const job of req.body) {
				if (job.cron !== undefined && !isValidCron(job.cron)) {
					throw reply.badRequest('Invalid cron expression');
				}

				await tx.eInkJob.update({
					where: { id: job.id },
					data: {
						...job,
						content: job.content ? JSON.stringify(job.content) : undefined,
						precise: job.cron ? isValidCronWithSeconds(job.cron) : undefined,
					},
				});
			}
		});
	});
};

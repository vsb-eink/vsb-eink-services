import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { RouteShorthandOptions } from 'fastify';

import {
	EInkJobInsertableSchema,
	EInkJobQuerySchema,
	EInkJobSelectableSchema,
	EInkJobUpdatableSchema,
	EmptyBodySchema,
} from '../../schemas.js';
import { db, Prisma } from '../../../database.js';

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
			commandArgs: JSON.parse(job.commandArgs),
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
	app.post('/', createJobOpts, async (req) => {
		const job = await db.eInkJob.create({
			data: { ...req.body, commandArgs: JSON.stringify(req.body.commandArgs) },
		});

		return {
			...job,
			commandArgs: JSON.parse(job.commandArgs),
		};
	});

	const deleteJobsOpts = {
		schema: {
			response: {
				204: EmptyBodySchema,
			},
			querystring: Type.Object({
				ids: Type.Optional(Type.Array(Type.Integer())),
			}),
		},
	} satisfies RouteShorthandOptions;
	app.delete('/', deleteJobsOpts, async (req, reply) => {
		const { ids } = req.query;

		if (ids === undefined) {
			return reply.badRequest();
		}

		await db.eInkJob.deleteMany({ where: { id: { in: ids } } });
	});

	const updateJobsOpts = {
		schema: {
			body: Type.Array(EInkJobUpdatableSchema),
			response: {
				204: EmptyBodySchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.patch('/', updateJobsOpts, async (req) => {
		await db.$transaction(async (tx) => {
			for (const job of req.body) {
				const data: Prisma.EInkJobUpdateInput = {};

				if (job.name !== undefined) data.name = job.name;
				if (job.cron !== undefined) data.cron = job.cron;
				if (job.target !== undefined) data.target = job.target;
				if (job.command !== undefined) data.command = job.command;
				if (job.commandType !== undefined) data.commandType = job.commandType;
				if (job.commandArgs !== undefined) {
					data.commandArgs = JSON.stringify(job.commandArgs);
				}
				if (job.hasSeconds !== undefined) data.hasSeconds = job.hasSeconds;
				if (job.priority !== undefined) data.priority = job.priority;
				if (job.cycle !== undefined) data.cycle = job.cycle;
				if (job.shouldCycle !== undefined) data.shouldCycle = job.shouldCycle;
				if (job.disabled !== undefined) data.disabled = job.disabled;

				await tx.eInkJob.update({
					where: { id: job.id },
					data,
				});
			}
		});
	});
};

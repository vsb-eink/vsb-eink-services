import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox';
import FastifyReplyFrom from '@fastify/reply-from';

import { joinUrl } from '../utils.js';
import { SCHEDULER_URL } from '../environment.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyScope } from '../guards/scope.js';
import { db, Role, Scope } from '../database.js';
import { verifyRole } from '../guards/role.js';
import {
	HttpErrorSchema,
	InsertableScheduledJobSchema,
	ScheduledJobSchema,
	UpdatableScheduledJobSchema,
} from '../schemas.js';
import axios from 'axios';
import { FastifyRequest } from 'fastify';

async function hasAccessTo(request: FastifyRequest, target: string) {
	if (request.user.role === Role.ADMIN) {
		return true;
	}

	const accessToPanel = await db.panel.findUnique({
		where: {
			id: target,
			groups: {
				some: { managedBy: { some: { users: { some: { id: request.user.id } } } } },
			},
		},
		select: { id: true },
	});
	if (accessToPanel) {
		return true;
	}

	const accessToGroup = await db.panelGroup.findUnique({
		where: {
			id: target,
			managedBy: { some: { users: { some: { id: request.user.id } } } },
		},
		select: { id: true },
	});
	if (accessToGroup) {
		return true;
	}

	return false;
}

export const scheduleRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.register(FastifyReplyFrom);

	app.route({
		method: 'GET',
		url: '/',
		schema: {
			response: {
				200: Type.Array(Type.Ref(ScheduledJobSchema)),
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_READ)],
		]),
		handler: async (request, reply) => {
			const jobs = await axios.get<Static<typeof ScheduledJobSchema>[]>(
				joinUrl(SCHEDULER_URL, '/jobs'),
				{ validateStatus: () => true },
			);
			if (jobs.status >= 400) {
				return reply.status(jobs.status).send(jobs.data);
			}

			if (request.user.role === Role.ADMIN) {
				return jobs.data;
			}

			const [accessiblePanels, accessibleGroups] = await Promise.all([
				db.panel.findMany({
					select: { id: true },
					where: {
						groups: {
							some: {
								managedBy: { some: { users: { some: { id: request.user.id } } } },
							},
						},
					},
				}),
				db.panelGroup.findMany({
					select: { id: true },
					where: {
						managedBy: { some: { users: { some: { id: request.user.id } } } },
					},
				}),
			]);

			return jobs.data.filter(
				(job) =>
					accessiblePanels.findIndex((p) => p.id === job.target) !== -1 ||
					accessibleGroups.findIndex((g) => g.id === job.target) !== -1,
			);
		},
	});

	app.route({
		method: 'POST',
		url: '/',
		schema: {
			body: Type.Ref(InsertableScheduledJobSchema),
			response: {
				201: Type.Ref(ScheduledJobSchema),
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_WRITE)],
		]),
		handler: async (request, reply) => {
			if (!(await hasAccessTo(request, request.body.target))) {
				return reply.forbidden();
			}
			return reply.from(joinUrl(SCHEDULER_URL, '/jobs'));
		},
	});

	/** single job routes */
	const JobPathParamsSchema = Type.Object({ jobId: Type.String() });

	app.route({
		method: 'GET',
		url: '/:jobId',
		schema: {
			params: JobPathParamsSchema,
			response: {
				200: Type.Ref(ScheduledJobSchema),
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_READ)],
		]),
		handler: async (request, reply) => {
			const job = await axios.get<Static<typeof ScheduledJobSchema>>(
				joinUrl(SCHEDULER_URL, '/jobs', request.params.jobId),
				{ validateStatus: () => true },
			);
			if (job.status >= 400) {
				return reply.status(job.status).send(job.data);
			}

			if (!(await hasAccessTo(request, job.data.target))) {
				return reply.forbidden();
			}

			return job.data;
		},
	});

	app.route({
		method: 'PATCH',
		url: '/:jobId',
		schema: {
			params: JobPathParamsSchema,
			body: Type.Ref(UpdatableScheduledJobSchema),
			response: {
				200: Type.Ref(ScheduledJobSchema),
				404: HttpErrorSchema,
			},
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_WRITE)],
		]),
		handler: async (request, reply) => {
			const job = await axios.get<Static<typeof ScheduledJobSchema>>(
				joinUrl(SCHEDULER_URL, '/jobs', request.params.jobId),
				{ validateStatus: () => true },
			);

			if (!(await hasAccessTo(request, job.data.target))) {
				return reply.forbidden();
			}

			return reply.from(joinUrl(SCHEDULER_URL, '/jobs', request.params.jobId));
		},
	});

	app.route({
		method: 'DELETE',
		url: '/:jobId',
		schema: {
			params: JobPathParamsSchema,
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_WRITE)],
		]),
		handler: async (request, reply) => {
			const job = await axios.get<Static<typeof ScheduledJobSchema>>(
				joinUrl(SCHEDULER_URL, '/jobs', request.params.jobId),
				{ validateStatus: () => true },
			);

			if (!(await hasAccessTo(request, job.data.target))) {
				return reply.forbidden();
			}

			return reply.from(joinUrl(SCHEDULER_URL, '/jobs', request.params.jobId));
		},
	});
};

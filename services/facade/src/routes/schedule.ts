import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import FastifyReplyFrom from '@fastify/reply-from';

import { joinUrl } from '../utils.js';
import { SCHEDULER_URL } from '../environment.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyScope } from '../guards/scope.js';
import { Role, Scope } from '../database.js';
import { verifyRole } from '../guards/role.js';

export const scheduleRoutes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.register(FastifyReplyFrom);

	app.route({
		method: 'GET',
		url: '/',
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_READ)],
		]),
		handler: async (request, reply) => {
			return reply.from(joinUrl(SCHEDULER_URL, '/jobs'));
		},
	});

	app.route({
		method: 'POST',
		url: '/',
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_WRITE)],
		]),
		handler: async (request, reply) => {
			return reply.from(joinUrl(SCHEDULER_URL, '/jobs'));
		},
	});

	app.route({
		method: 'DELETE',
		url: '/',
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_WRITE)],
		]),
		handler: async (request, reply) => {
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
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_READ)],
		]),
		handler: async (request, reply) => {
			return reply.from(joinUrl(SCHEDULER_URL, '/jobs', request.params.jobId));
		},
	});

	app.route({
		method: 'PATCH',
		url: '/:jobId',
		schema: {
			params: JobPathParamsSchema,
		},
		onRequest: app.auth([
			[verifyJWT, verifyRole(Role.ADMIN)],
			[verifyJWT, verifyScope(Scope.SCHEDULE_WRITE)],
		]),
		handler: async (request, reply) => {
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
			return reply.from(joinUrl(SCHEDULER_URL, '/jobs', request.params.jobId));
		},
	});
};

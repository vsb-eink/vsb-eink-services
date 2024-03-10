import { Type } from '@fastify/type-provider-typebox';
import FastifyReplyFrom from '@fastify/reply-from';
import { joinUrl } from '../utils.js';
import { SCHEDULER_URL } from '../environment.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyScope } from '../guards/scope.js';
import { Role, Scope } from '../database.js';
import { verifyRole } from '../guards/role.js';
export const scheduleRoutes = async (app, opts) => {
    app.register(FastifyReplyFrom);
    app.route({
        method: 'GET',
        url: '/',
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.SCHEDULE_READ)],
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(SCHEDULER_URL, '/jobs'));
        },
    });
    app.route({
        method: 'POST',
        url: '/',
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.SCHEDULE_WRITE)],
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(SCHEDULER_URL, '/jobs'));
        },
    });
    app.route({
        method: 'DELETE',
        url: '/',
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.SCHEDULE_WRITE)],
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(SCHEDULER_URL, '/jobs'));
        },
    });
    /** single job routes */
    const JobPathParamsSchema = Type.Object({ id: Type.String() });
    app.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: JobPathParamsSchema,
        },
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.SCHEDULE_READ)],
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(SCHEDULER_URL, '/jobs', request.params.id));
        },
    });
    app.route({
        method: 'PATCH',
        url: '/:id',
        schema: {
            params: JobPathParamsSchema,
        },
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.SCHEDULE_WRITE)],
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(SCHEDULER_URL, '/jobs', request.params.id));
        },
    });
    app.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: JobPathParamsSchema,
        },
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.SCHEDULE_WRITE)],
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(SCHEDULER_URL, '/jobs', request.params.id));
        },
    });
};
//# sourceMappingURL=schedule.js.map
import { Type } from '@fastify/type-provider-typebox';
import FastifyReplyFrom from '@fastify/reply-from';
import { joinUrl } from '../utils.js';
import { GROUPER_URL } from '../environment.js';
import { verifyJWT } from '../guards/jwt.js';
import axios from 'axios';
import { GenericObjectWithId, HttpErrorSchema } from '../schemas.js';
import { db, isNotFoundError, Role, Scope } from '../database.js';
import { verifyScope } from '../guards/scope.js';
import { verifyRole } from '../guards/role.js';
import { verifyAccessToPanelGroup } from '../guards/owner.js';
const PanelGroupSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    panels: Type.Array(GenericObjectWithId),
});
async function filterUsersPanelGroups(groups, user) {
    const panelGroupsOfUser = await db.panelGroup.findMany({
        where: { managedBy: { some: { users: { some: user } } } },
    });
    return groups.filter((group) => panelGroupsOfUser.some((panelGroup) => panelGroup.id === group.id));
}
export const panelGroupsRoutes = async (app) => {
    app.register(FastifyReplyFrom);
    app.route({
        url: '/',
        method: 'GET',
        schema: {
            response: {
                200: Type.Array(PanelGroupSchema),
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_READ)]]),
        handler: async (request, reply) => {
            const groups = await axios.get(joinUrl(GROUPER_URL, '/groups'), {
                validateStatus: () => true,
            });
            reply.statusCode = groups.status;
            if (groups.status >= 400) {
                return groups.data;
            }
            if (request.user.role === Role.ADMIN) {
                return groups;
            }
            return filterUsersPanelGroups(groups.data, request.user);
        },
    });
    app.route({
        url: '/',
        method: 'POST',
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_WRITE)],
            verifyAccessToPanelGroup,
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(GROUPER_URL, '/groups'));
        },
    });
    const PanelGroupParams = Type.Object({ id: Type.String() });
    app.route({
        url: '/:id',
        method: 'GET',
        schema: {
            params: PanelGroupParams,
            response: {
                200: PanelGroupSchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_READ)],
            verifyAccessToPanelGroup,
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(GROUPER_URL, '/groups', request.params.id));
        },
    });
    app.route({
        url: '/:id',
        method: ['PATCH'],
        schema: {
            params: PanelGroupParams,
        },
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_READ)],
            verifyAccessToPanelGroup,
        ]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(GROUPER_URL, '/groups', request.params.id));
        },
    });
    app.route({
        url: '/:id',
        method: ['DELETE'],
        schema: {
            params: PanelGroupParams,
        },
        onRequest: app.auth([
            verifyJWT,
            [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_READ)],
            verifyAccessToPanelGroup,
        ]),
        handler: async (request, reply) => {
            try {
                await db.panelGroup;
            }
            catch (error) {
                if (isNotFoundError(error)) {
                    return reply.notFound();
                }
                throw error;
            }
        },
    });
};
//# sourceMappingURL=panel-groups.js.map
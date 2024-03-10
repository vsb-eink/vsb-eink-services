import { Type } from '@fastify/type-provider-typebox';
import FastifyReplyFrom from '@fastify/reply-from';
import axios from 'axios';
import { GROUPER_URL } from '../environment.js';
import { joinUrl } from '../utils.js';
import { verifyJWT } from '../guards/jwt.js';
import { Role, Scope, db } from '../database.js';
import { verifyScope } from '../guards/scope.js';
import { verifyRole } from '../guards/role.js';
const PanelSchema = Type.Object({
    id: Type.String(),
    groups: Type.Array(Type.Object({ id: Type.String(), name: Type.String() })),
});
async function userHasPanelAccess(user, panelId) {
    if (user.role === Role.ADMIN) {
        return true;
    }
    const managedPanelGroupsOfUser = await db.panelGroup.findMany({
        where: { managedBy: { some: { users: { some: { id: user.id } } } } },
    });
    const panel = await axios.get(joinUrl(GROUPER_URL, '/panels', panelId), {
        validateStatus: () => true,
    });
    if (panel.status >= 400) {
        return false;
    }
    return managedPanelGroupsOfUser.some((group) => panel.data.groups.some((panelGroup) => panelGroup.id === group.id));
}
async function filterUserPanels(panels, user) {
    if (user.role === Role.ADMIN) {
        return panels;
    }
    const userGroups = await db.userGroup.findMany({
        where: { users: { some: { id: user.id } } },
        include: { managedPanelGroups: true },
    });
    const userPanelGroups = userGroups.flatMap((group) => group.managedPanelGroups.map((panelGroup) => panelGroup.id));
    return filterPanelsByGroup(panels, userPanelGroups);
}
function filterPanelsByGroup(panels, groups) {
    return panels.filter((panel) => panel.groups.some((group) => groups.includes(group.id)));
}
export const panelsRoutes = async (app, opts) => {
    app.register(FastifyReplyFrom);
    app.route({
        url: '/',
        method: 'GET',
        schema: {
            response: {
                200: Type.Array(PanelSchema),
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_READ)]]),
        handler: async (request, reply) => {
            const panels = await axios.get(joinUrl(GROUPER_URL, '/panels'), {
                params: request.query,
                validateStatus: () => true,
            });
            reply.statusCode = panels.status;
            if (panels.status >= 400) {
                return panels.data;
            }
        },
    });
    app.route({
        url: '/',
        method: 'POST',
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_WRITE)]]),
        handler: async (request, reply) => {
            return reply.from(joinUrl(GROUPER_URL, '/panels'));
        },
    });
    const PanelPathParamsSchema = Type.Object({ id: Type.String() });
    app.route({
        url: '/:id',
        method: 'GET',
        schema: {
            params: PanelPathParamsSchema,
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_READ)]]),
        handler: async (request, reply) => {
            if (!(await userHasPanelAccess(request.user, request.params.id))) {
                return reply.forbidden();
            }
            return reply.from(joinUrl(GROUPER_URL, '/panels', request.params.id));
        },
    });
    app.route({
        url: '/:id',
        method: ['PATCH', 'DELETE'],
        schema: {
            params: PanelPathParamsSchema,
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.PANELS_WRITE)]]),
        handler: async (request, reply) => {
            if (!(await userHasPanelAccess(request.user, request.params.id))) {
                return reply.forbidden();
            }
            return reply.from(joinUrl(GROUPER_URL, '/panels', request.params.id));
        },
    });
};
//# sourceMappingURL=panels.js.map
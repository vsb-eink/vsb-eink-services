import { Type } from '@fastify/type-provider-typebox';
import { Role, Scope, db, isNotFoundError } from '../database.js';
import { EmptyBodySchema, HttpErrorSchema, InsertableUserGroupSchema, UpdatableUserGroupSchema, UserGroupSchema, } from '../schemas.js';
import { verifyScope } from '../guards/scope.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyRole } from '../guards/role.js';
export const userGroupsRoutes = async (app) => {
    app.route({
        method: 'GET',
        url: '/',
        schema: {
            response: {
                200: Type.Array(UserGroupSchema),
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_READ)]]),
        handler: async (request, reply) => {
            return db.userGroup.findMany({ include: { users: true, managedPanelGroups: true } });
        },
    });
    app.route({
        method: 'POST',
        url: '/',
        schema: {
            body: InsertableUserGroupSchema,
            response: {
                201: UserGroupSchema,
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_WRITE)]]),
        handler: async (request) => {
            return db.userGroup.create({
                data: {
                    name: request.body.name,
                    scopes: request.body.scopes,
                    users: { connect: request.body.users?.map(({ id }) => ({ id })) },
                    managedPanelGroups: {
                        connect: request.body.managedPanelGroups?.map(({ id }) => ({ id })),
                    },
                },
                include: { users: true, managedPanelGroups: true },
            });
        },
    });
    /** single user group routes */
    const UserGroupPathParamsSchema = Type.Object({ id: Type.Number() });
    app.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: UserGroupPathParamsSchema,
            response: {
                200: UserGroupSchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_READ)]]),
        handler: async (request, reply) => {
            const group = db.userGroup.findUnique({
                where: { id: request.params.id },
                include: { users: true, managedPanelGroups: true },
            });
            if (!group) {
                return reply.notFound();
            }
            return group;
        },
    });
    app.route({
        method: 'PATCH',
        url: '/:id',
        schema: {
            params: UserGroupPathParamsSchema,
            body: UpdatableUserGroupSchema,
            response: {
                200: UserGroupSchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_WRITE)]]),
        handler: async (request, reply) => {
            try {
                return await db.userGroup.update({
                    where: { id: request.params.id },
                    data: {
                        name: request.body.name,
                        scopes: request.body.scopes,
                        users: { set: request.body.users?.map(({ id }) => ({ id })) },
                        managedPanelGroups: {
                            set: request.body.managedPanelGroups?.map(({ id }) => ({ id })),
                        },
                    },
                    include: { users: true, managedPanelGroups: true },
                });
            }
            catch (error) {
                if (isNotFoundError(error)) {
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
            params: UserGroupPathParamsSchema,
            response: {
                204: EmptyBodySchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_WRITE)]]),
        handler: async (request, reply) => {
            try {
                await db.userGroup.delete({ where: { id: request.params.id } });
                reply.status(204);
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
//# sourceMappingURL=user-groups.js.map
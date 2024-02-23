import { Type } from '@fastify/type-provider-typebox';
import argon2 from 'argon2';
import { Role, Scope, db, isNotFoundError } from '../database.js';
import { EmptyBodySchema, HttpErrorSchema, InsertableUserSchema, UserSchema } from '../schemas.js';
import { verifyScope } from '../guards/scope.js';
import { verifyJWT } from '../guards/jwt.js';
import { verifyRole } from '../guards/role.js';
export const usersRoutes = async (app, opts) => {
    app.route({
        method: 'GET',
        url: '/',
        schema: {
            response: {
                200: Type.Array(UserSchema),
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_READ)]]),
        handler: async (request, reply) => {
            return db.user.findMany({ include: { groups: true } });
        },
    });
    app.route({
        method: 'POST',
        url: '/',
        schema: {
            body: InsertableUserSchema,
            response: {
                201: UserSchema,
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_WRITE)]]),
        handler: async (request) => {
            const hashedPassword = await argon2.hash(request.body.password);
            return await db.user.create({
                data: {
                    username: request.body.username,
                    password: hashedPassword,
                    role: request.body.role,
                },
                include: { groups: true },
            });
        },
    });
    /** single user routes */
    const UserPathParamsSchema = Type.Object({ id: Type.Number() });
    app.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: UserPathParamsSchema,
            response: {
                200: UserSchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_READ)]]),
        handler: async (request, reply) => {
            const user = db.user.findUnique({
                where: { id: request.params.id },
                include: { groups: true },
            });
            if (!user) {
                reply.status(404);
                return { message: 'User not found' };
            }
            return user;
        },
    });
    app.route({
        method: 'PATCH',
        url: '/:id',
        schema: {
            params: UserPathParamsSchema,
            body: InsertableUserSchema,
            response: {
                200: UserSchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_WRITE)]]),
        handler: async (request, reply) => {
            try {
                return await db.user.update({
                    where: { id: request.params.id },
                    data: request.body,
                    include: { groups: true },
                });
            }
            catch (error) {
                if (isNotFoundError(error)) {
                    reply.status(404);
                    return { message: 'User not found' };
                }
                throw error;
            }
        },
    });
    app.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: UserPathParamsSchema,
            response: {
                204: EmptyBodySchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([verifyJWT, [verifyRole(Role.ADMIN), verifyScope(Scope.USERS_WRITE)]]),
        handler: async (request, reply) => {
            try {
                await db.user.delete({ where: { id: request.params.id } });
                reply.status(204);
            }
            catch (error) {
                if (isNotFoundError(error)) {
                    reply.status(404);
                    return { message: 'User not found' };
                }
                throw error;
            }
        },
    });
};
//# sourceMappingURL=users.js.map
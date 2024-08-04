import { sep, join, dirname } from 'node:path';
import {chmod, copyFile, mkdir, rename, rm } from 'node:fs/promises';

import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import FastifyMultiPart from '@fastify/multipart';

import { HOSTED_CONTENT_PATH } from '../../environment.js';
import {
    pathExists,
    isDirectory,
    readPathRecursive,
    isFile,
    extractWildcardParam,
} from '../../utils.js';
import {verifyJWT} from "../../guards/jwt.js";
import {verifyRole} from "../../guards/role.js";
import {verifyScope} from "../../guards/scope.js";
import {Role, Scope} from '../../database.js';

export const EmptyBodySchema = Type.Null();
export const HttpErrorSchema = Type.Ref('HttpError');

const DirentSchema = Type.Recursive(
    (This) =>
        Type.Intersect([
            Type.Object({
                name: Type.String(),
                path: Type.String({ format: 'uri-reference' }),
            }),
            Type.Union([
                Type.Object({
                    type: Type.Literal('file'),
                }),
                Type.Object({
                    type: Type.Literal('directory'),
                    children: Type.Array(This),
                }),
            ]),
        ]),
    { $id: 'Dirent' },
);

export const coreFilesRoutes: FastifyPluginAsyncTypebox = async function (app, opts) {
    // Register the multipart plugin to handle file uploads
    // Limit the file size to 100MB
    app.register(FastifyMultiPart, { limits: { fileSize: 100 * 1000 * 1000 } });

    app.get('*', {
        schema: {
            response: {
                200: DirentSchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([
            [verifyJWT, verifyRole(Role.ADMIN)],
            [verifyJWT, verifyScope(Scope.HOSTED_READ)],
        ]),
    }, async (request, reply) => {
        const targetPath = extractWildcardParam(request);
        const fullPath = join(HOSTED_CONTENT_PATH, targetPath);

        return readPathRecursive(fullPath, {
            stripRoot: true,
            pathModifier: (path) => `${path.replaceAll(sep, '/')}`,
        });
    });

    app.post('*', {
        schema: {
            response: {
                201: DirentSchema,
                409: HttpErrorSchema,
            },
        },
        onRequest: app.auth([
            [verifyJWT, verifyRole(Role.ADMIN)],
            [verifyJWT, verifyScope(Scope.HOSTED_WRITE)],
        ]),
    }, async (request, reply) => {
        const targetPath = extractWildcardParam(request);
        const fullPath = join(HOSTED_CONTENT_PATH, targetPath);

        if (await isFile(fullPath)) {
            return reply.conflict('File already exists');
        }

        if (!(await isDirectory(fullPath))) {
            await mkdir(fullPath, { recursive: true });
        }

        if (request.isMultipart()) {
            const files = await request.saveRequestFiles();

            for (const file of files) {
                await copyFile(file.filepath, join(fullPath, file.filename));

                if (targetPath.startsWith('/cgi-bin')) {
                    await chmod(join(fullPath, file.filename), 0o755);
                }
            }
        }

        reply.statusCode = 201;
        return readPathRecursive(fullPath, {
            stripRoot: true,
            pathModifier: (path) => `${path.replaceAll(sep, '/')}`,
        });
    });

    app.put('*', {
        schema: {
            response: {
                200: DirentSchema,
                201: DirentSchema,
                400: HttpErrorSchema,
                409: HttpErrorSchema,
            },
        },
        onRequest: app.auth([
            [verifyJWT, verifyRole(Role.ADMIN)],
            [verifyJWT, verifyScope(Scope.HOSTED_WRITE)],
        ]),
    }, async (request, reply) => {
        const targetPath = extractWildcardParam(request);
        const fullPath = join(HOSTED_CONTENT_PATH, targetPath);

        const files = await request.saveRequestFiles();

        if (files.length !== 1) {
            return reply.badRequest('Invalid number of files');
        }

        if (await isDirectory(fullPath)) {
            return reply.conflict('Path is a directory');
        }

        if (await isFile(fullPath)) {
            reply.statusCode = 200;
        } else {
            reply.statusCode = 201;
        }

        await copyFile(files[0].filepath, fullPath);

        if (targetPath.startsWith('/cgi-bin')) {
            await chmod(fullPath, 0o755);
        }

        reply.statusCode = 201;
        return readPathRecursive(fullPath, {
            stripRoot: true,
            pathModifier: (path) => `${path.replaceAll(sep, '/')}`,
        });
    });

    app.patch('*', {
        schema: {
            body: Type.Pick(DirentSchema, ['name']),
            response: {
                200: DirentSchema,
                400: HttpErrorSchema,
                404: HttpErrorSchema,
                501: HttpErrorSchema,
            },
        },
        onRequest: app.auth([
            [verifyJWT, verifyRole(Role.ADMIN)],
            [verifyJWT, verifyScope(Scope.HOSTED_WRITE)],
        ]) as never,
    }, async (request, reply) => {
        const targetPath = extractWildcardParam(request);
        const fullPath = join(HOSTED_CONTENT_PATH, targetPath);

        if (!request.body.name) {
            return reply.notImplemented();
        }

        const parentPath = dirname(fullPath);
        const newFullPath = join(parentPath, request.body.name);

        if (!(await pathExists(fullPath))) {
            return reply.notFound();
        }

        await rename(fullPath, newFullPath);

        return readPathRecursive(newFullPath, {
            stripRoot: true,
            pathModifier: (path) => `${path.replaceAll(sep, '/')}`,
        });
    });

    app.delete('*', {
        schema: {
            response: {
                204: EmptyBodySchema,
                404: HttpErrorSchema,
            },
        },
        onRequest: app.auth([
            [verifyJWT, verifyRole(Role.ADMIN)],
            [verifyJWT, verifyScope(Scope.HOSTED_WRITE)],
        ]),
    }, async (request, reply) => {
        const targetPath = extractWildcardParam(request);
        const fullPath = join(HOSTED_CONTENT_PATH, targetPath);

        if (!(await pathExists(fullPath))) {
            return reply.notFound();
        }

        await rm(fullPath, { recursive: true });
    });
};

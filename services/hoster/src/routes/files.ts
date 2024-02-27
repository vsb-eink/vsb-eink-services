import { sep, join, dirname } from 'node:path';
import { mkdir, rename, rm } from 'node:fs/promises';

import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import FastifyMultiPart from '@fastify/multipart';

import { USER_CONTENT_PATH } from '../environment.js';
import {
	pathExists,
	isDirectory,
	readPathRecursive,
	isFile,
	extractWildcardParam,
} from '../utils.js';
import { RouteShorthandOptions } from 'fastify';

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

export const filesRoutes: FastifyPluginAsyncTypebox = async function (app, opts) {
	// Register the multipart plugin to handle file uploads
	// Limit the file size to 100MB
	app.register(FastifyMultiPart, { limits: { fileSize: 100 * 1000 * 1000 } });

	const getFilesOpts = {
		schema: {
			response: {
				200: DirentSchema,
				404: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.get('*', getFilesOpts, async (request, reply) => {
		const targetPath = extractWildcardParam(request);
		const fullPath = join(USER_CONTENT_PATH, targetPath);

		return readPathRecursive(fullPath, {
			stripRoot: true,
			pathModifier: (path) => `${path.replaceAll(sep, '/')}`,
		});
	});

	const createFilesOpts = {
		schema: {
			response: {
				201: DirentSchema,
				409: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.post('*', createFilesOpts, async (request, reply) => {
		const targetPath = extractWildcardParam(request);
		const fullPath = join(USER_CONTENT_PATH, targetPath);

		if (await isFile(fullPath)) {
			return reply.conflict('File already exists');
		}

		if (!(await isDirectory(fullPath))) {
			await mkdir(fullPath, { recursive: true });
		}

		if (request.isMultipart()) {
			const files = await request.saveRequestFiles();

			for (const file of files) {
				await rename(file.filepath, join(fullPath, file.filename));
			}
		}

		reply.statusCode = 201;
		return readPathRecursive(fullPath, {
			stripRoot: true,
			pathModifier: (path) => `${path.replaceAll(sep, '/')}`,
		});
	});

	const updateFilesOpts = {
		schema: {
			response: {
				200: DirentSchema,
				201: DirentSchema,
				400: HttpErrorSchema,
				409: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.put('*', updateFilesOpts, async (request, reply) => {
		const targetPath = extractWildcardParam(request);
		const fullPath = join(USER_CONTENT_PATH, targetPath);

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

		await rename(files[0].filepath, fullPath);

		reply.statusCode = 201;
		return readPathRecursive(fullPath, {
			stripRoot: true,
			pathModifier: (path) => `${path.replaceAll(sep, '/')}`,
		});
	});

	const renameFilesOpts = {
		schema: {
			body: Type.Pick(DirentSchema, ['name']),
			response: {
				200: DirentSchema,
				400: HttpErrorSchema,
				501: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.patch('*', renameFilesOpts, async (request, reply) => {
		const targetPath = extractWildcardParam(request);
		const fullPath = join(USER_CONTENT_PATH, targetPath);

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

	const deleteFilesOpts = {
		schema: {
			response: {
				204: EmptyBodySchema,
				404: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.delete('*', deleteFilesOpts, async (request, reply) => {
		const targetPath = extractWildcardParam(request);
		const fullPath = join(USER_CONTENT_PATH, targetPath);

		if (!(await pathExists(fullPath))) {
			return reply.notFound();
		}

		await rm(fullPath, { recursive: true });
	});
};

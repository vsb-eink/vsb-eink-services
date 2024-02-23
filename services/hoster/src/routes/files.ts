import { sep, join } from 'node:path';
import { mkdir, rename, rm } from 'node:fs/promises';

import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import FastifyMultiPart from '@fastify/multipart';
import { TypeCompiler } from '@sinclair/typebox/compiler';

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
	app.register(FastifyMultiPart);

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
			pathModifier: (path) => `/user/${path.replaceAll(sep, '/')}`,
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

		const files = await request.saveRequestFiles();

		if (await isFile(fullPath)) {
			return reply.conflict('File already exists');
		}

		if (!(await isDirectory(fullPath))) {
			await mkdir(fullPath, { recursive: true });
		}

		for (const file of files) {
			await rename(file.filepath, join(fullPath, file.filename));
		}

		reply.statusCode = 201;
		return readPathRecursive(fullPath, {
			stripRoot: true,
			pathModifier: (path) => `/user/${path.replaceAll(sep, '/')}`,
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
			pathModifier: (path) => `/user/${path.replaceAll(sep, '/')}`,
		});
	});

	const renameFilesOpts = {
		schema: {
			body: Type.Pick(DirentSchema, ['name']),
			response: {
				200: DirentSchema,
				400: HttpErrorSchema,
			},
		},
	} satisfies RouteShorthandOptions;
	app.patch('*', renameFilesOpts, async (request, reply) => {
		const targetPath = extractWildcardParam(request);
		const fullPath = join(USER_CONTENT_PATH, targetPath);

		const newPath = request.body.name;
		const newFullPath = join(USER_CONTENT_PATH, newPath);

		if (!(await pathExists(fullPath))) {
			return reply.notFound();
		}

		await rename(fullPath, newFullPath);

		return readPathRecursive(fullPath, {
			stripRoot: true,
			pathModifier: (path) => `/user/${path.replaceAll(sep, '/')}`,
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

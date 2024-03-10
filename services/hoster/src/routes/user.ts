import { fileURLToPath, pathToFileURL } from 'node:url';
import { PathLike } from 'node:fs';
import { join, resolve } from 'node:path';

import { RouteHandlerMethod } from 'fastify';
import FastifyStatic from '@fastify/static';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { USER_CONTENT_PATH } from '../environment.js';
import { extractWildcardParam, isDirectory, pathExists } from '../utils.js';
import { checksumFile } from '../hash.js';

async function findHandlerPath(path: PathLike): Promise<PathLike | null> {
	const moduleExtensions = ['.mts', '.ts', '.mjs', '.js'];

	if (await isDirectory(path)) {
		const indexFiles = moduleExtensions.map((ext) => join(path.toString(), `index${ext}`));
		for (const possiblePath of indexFiles) {
			if (await pathExists(possiblePath)) {
				return possiblePath;
			}
		}
	}

	if (await pathExists(path)) {
		return path;
	}

	const moduleFiles = moduleExtensions.map((ext) => path.toString() + ext);
	for (const possiblePath of moduleFiles) {
		if (await pathExists(possiblePath)) {
			return possiblePath;
		}
	}

	return null;
}

async function importHandler(path: PathLike): Promise<RouteHandlerMethod | null> {
	const url = pathToFileURL(path.toString());

	try {
		const checksum = await checksumFile('md5', url);
		url.searchParams.set('checksum', checksum);

		const module = await import(url.toString());

		if (typeof module.default !== 'function') {
			return null;
		}

		return module.default;
	} catch (error) {
		return null;
	}
}

export const userRoutes: FastifyPluginAsyncTypebox = async (app) => {
	app.register(FastifyStatic, {
		root: resolve(USER_CONTENT_PATH),
		serve: false,
		allowedPath: (path) => !path.startsWith('_'),
	});

	app.all('*', async (request, reply) => {
		const requestedPath = extractWildcardParam(request);
		const localUrl = pathToFileURL(join(USER_CONTENT_PATH, requestedPath));
		const localPath = fileURLToPath(localUrl);

		const routePath = await findHandlerPath(localPath);
		if (routePath === null) {
			if (await isDirectory(localPath)) {
				return reply.forbidden();
			}

			return reply.sendFile(requestedPath);
		}

		const route = await importHandler(routePath);
		if (route === null) {
			if (await isDirectory(localPath)) {
				return reply.forbidden();
			}

			return reply.sendFile(requestedPath);
		}

		return route.call(app, request, reply);
	});
};

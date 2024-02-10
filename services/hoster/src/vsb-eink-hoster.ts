import { PathLike } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import Fastify, { RouteHandlerMethod } from 'fastify';
import FastifyStaticPlugin from '@fastify/static';
import FastifyUrlDataPlugin from '@fastify/url-data';

import {
	API_HOST,
	API_PORT,
	CONTENT_PATH,
	CORE_CONTENT_DIRNAME,
	USER_CONTENT_DIRNAME,
} from './environment.js';
import { checksumFile } from './hash.js';

async function importRoute(path: PathLike): Promise<RouteHandlerMethod> {
	const url = pathToFileURL(path.toString());

	const checksum = await checksumFile('md5', url);
	url.searchParams.set('checksum', checksum);

	const module = await import(url.toString());

	if (typeof module.default !== 'function') {
		throw new Error(
			`Expected default export to be a function, but got ${typeof module.default}`,
		);
	}

	return module.default;
}

const app = await Fastify({ logger: true });
await app.register(FastifyUrlDataPlugin);
await app.register(FastifyStaticPlugin, {
	root: resolve(CONTENT_PATH),
	serve: false,
	allowedPath: (path) =>
		[CORE_CONTENT_DIRNAME, USER_CONTENT_DIRNAME].some((name) =>
			path.replace(/^\//, '').startsWith(name),
		),
});

app.all('*', async (request, reply) => {
	const fileUrl = pathToFileURL(join(CONTENT_PATH, request.urlData('path')!));
	const filePath = fileURLToPath(fileUrl);

	try {
		const plugin = await importRoute(filePath);
		return plugin.call(app, request, reply);
	} catch {
		return reply.sendFile(request.url);
	}
});

await app.listen({
	host: API_HOST,
	port: API_PORT,
	listenTextResolver: (address) => `Listening on ${address}`,
});

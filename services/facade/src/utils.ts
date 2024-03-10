import { join as joinPosixPath } from 'node:path/posix';
import { FastifyRequest } from 'fastify';

export function joinUrl(...parts: string[]): string {
	if (!Array.isArray(parts)) {
		throw new TypeError(`Expected string arguments`);
	}

	if (parts.length === 0) {
		throw new Error(`Expected at least one url part`);
	}

	const fullUrl = new URL(parts[0]);

	fullUrl.pathname = joinPosixPath(fullUrl.pathname, ...parts.slice(1));

	return fullUrl.toString();
}

export function extractWildcardParam(request: FastifyRequest) {
	if (!request.params) {
		throw new Error(`Wildcard parameter not found`);
	}

	if (typeof (request.params as any)['*'] !== 'string') {
		throw new TypeError(`Wildcard parameter is not a string`);
	}

	return (request.params as { '*': string })['*'];
}

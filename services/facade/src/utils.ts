import { access, lstat, readdir } from 'node:fs/promises';
import { PathLike } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';
import { join as joinPosixPath } from 'node:path';

import { FastifyRequest } from "fastify";

import { HOSTED_CONTENT_PATH } from "./environment.js";

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

export async function pathExists(path: PathLike): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch (error) {
		return false;
	}
}

export async function isFile(path: PathLike): Promise<boolean> {
	try {
		const stats = await lstat(path);
		return stats.isFile();
	} catch (error) {
		return false;
	}
}

export async function isDirectory(path: PathLike): Promise<boolean> {
	try {
		const stats = await lstat(path);
		return stats.isDirectory();
	} catch (error) {
		return false;
	}
}

export interface SimpleDirent {
	name: string;
	path: string;
}

export interface SimpleDirentFile extends SimpleDirent {
	type: 'file';
}

export interface SimpleDirentDirectory extends SimpleDirent {
	type: 'directory';
	children: (SimpleDirentFile | SimpleDirentDirectory)[];
}

export function stripRoot(path: PathLike) {
	return path.toString().replace(HOSTED_CONTENT_PATH, '').split(sep).splice(1).join('/');
}

export async function readPathRecursive(
	path: PathLike,
	opts?: {
		pathModifier?: (path: string) => string;
		stripRoot?: boolean;
	},
): Promise<SimpleDirentFile | SimpleDirentDirectory> {
	const entry = await lstat(path);

	const entryPath = dirname(path.toString());
	const entryName = basename(path.toString());

	let modifiedEntryFullPath = join(entryPath, entryName);
	if (opts?.stripRoot) {
		modifiedEntryFullPath = stripRoot(modifiedEntryFullPath);
	}
	if (opts?.pathModifier) {
		modifiedEntryFullPath = opts.pathModifier(modifiedEntryFullPath);
	}

	if (entry.isDirectory()) {
		const children: (SimpleDirentFile | SimpleDirentDirectory)[] = [];
		const childEntries = await readdir(path, { withFileTypes: true });

		for (const childEntry of childEntries) {
			const childPath = join(path.toString(), childEntry.name);
			const child = await readPathRecursive(childPath, opts);
			children.push(child);
		}

		return {
			name: entryName,
			path: modifiedEntryFullPath,
			type: 'directory',
			children,
		};
	} else {
		return {
			name: entryName,
			path: modifiedEntryFullPath,
			type: 'file',
		};
	}
}

export function extractWildcardParam(request: FastifyRequest) {
	const root = request.routeOptions.url.replace('*', '');
	const path = new URL(request.url, 'https://not-exists.com').pathname;
	return path.replace(root, '');
}
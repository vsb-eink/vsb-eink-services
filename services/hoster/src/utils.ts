import { access, lstat, readdir } from 'node:fs/promises';
import { PathLike } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';

import { FastifyRequest } from 'fastify';

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
	return path.toString().split(sep).slice(1).join(sep);
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
	return request.url.replace(request.routeOptions.url.replace('*', ''), '');
}

import { PathLike } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { join as joinPosixPath } from 'node:path/posix';

export function isEmpty(value: unknown) {
	return value && Object.keys(value).length === 0;
}

export async function canAccess(path: PathLike, mode?: number | undefined) {
	try {
		await access(path, mode);
		return true;
	} catch {
		return false;
	}
}

export async function sleep({ minutes = 0, seconds = 0, ms = 0 }) {
	return new Promise((resolve) => setTimeout(resolve, ms + seconds * 1000 + minutes * 60 * 1000));
}

export async function getLastModifiedDate(path: PathLike) {
	const stats = await stat(path);
	return stats.mtime;
}

export function isHttpUrl(url: string) {
	return url.startsWith('http://') || url.startsWith('https://');
}

export async function fetchMimeType(url: string) {
	const response = await fetch(url, { method: 'HEAD' });
	const contentType = response.headers.get('content-type');
	if (!contentType) {
		throw new Error(`No content-type header found`);
	}
	return contentType;
}

import { PathLike } from 'node:fs';
import { access } from 'node:fs/promises';

export function isEmpty(value: unknown) {
	return value && Object.keys(value).length === 0;
}

export async function canAccess(path: PathLike, mode?: number | undefined) {
	try {
		await access(path, mode);
		return true;
	} catch (err) {
		return false;
	}
}

export async function sleep({ minutes = 0, seconds = 0, ms = 0 }) {
	return new Promise((resolve) =>
		setTimeout(resolve, ms + seconds * 1000 + minutes * 60 * 1000),
	);
}

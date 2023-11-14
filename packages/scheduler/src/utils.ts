import { PathLike } from 'fs';
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

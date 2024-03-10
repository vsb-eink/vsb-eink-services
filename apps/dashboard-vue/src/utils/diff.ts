import { isEqual } from 'lodash';

export function diff<T extends object>(a: T, b: T): Partial<T> {
	const diff: Partial<T> = {};
	for (const key in a) {
		if (!isEqual(a[key], b[key])) {
			diff[key] = b[key];
		}
	}
	return diff;
}

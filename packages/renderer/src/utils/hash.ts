import { createHash } from 'node:crypto';

export function toHash(data: string | Buffer, algorithm = 'sha128'): string {
	const hashFunction = createHash(algorithm);
	hashFunction.update(data);
	return hashFunction.digest('hex');
}

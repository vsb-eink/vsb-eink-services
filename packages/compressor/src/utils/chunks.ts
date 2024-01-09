export function* toChunks<T>(array: Iterable<T>, size: number) {
	let chunk = [];
	for (const item of array) {
		chunk.push(item);
		if (chunk.length === size) {
			yield chunk;
			chunk = [];
		}
	}
	if (chunk.length > 0) {
		yield chunk;
	}
}

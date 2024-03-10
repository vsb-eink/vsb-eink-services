export async function fetchMimeType(url: string): Promise<string> {
	const response = await fetch(url, { method: 'HEAD' });
	return response.headers.get('content-type') ?? '';
}

export async function fetchBuffer(url: string): Promise<ArrayBuffer> {
	const response = await fetch(url);
	return response.arrayBuffer();
}

export async function fetchMimeType(url: string): Promise<string> {
	const response = await fetch(url, { method: 'HEAD' });
	return response.headers.get('content-type') ?? '';
}

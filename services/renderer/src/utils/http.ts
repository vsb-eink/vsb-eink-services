export async function fetchMimeType(url: string): Promise<string> {
	const response = await fetch(url, { method: 'HEAD' }).then((res) => {
		return res.status === 405 ? fetch(url, { method: 'GET' }) : res;
	});
	return response.headers.get('content-type') || '';
}

import assert from 'node:assert/strict';

const API_PORT = process.env['API_PORT'] || 3000;

fetch(`http://localhost:${API_PORT}/status`)
	.then(async (res) => {
		assert(res.ok, 'API is not healthy');
		try {
			const json = await res.json();
			assert(json.status === 'ok', 'API is not healthy');
		} catch (e) {
			assert(false, 'API is not healthy');
		}
	})
	.catch(() => {
		process.exit(1);
	});

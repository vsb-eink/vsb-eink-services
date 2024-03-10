import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { router } from '@/router/index';

export async function redirectToNotFound(from: RouteLocationNormalizedLoaded) {
	return router.push({
		name: 'NotFound',
		params: { pathMatch: from.path.substring(1).split('/') },
		query: from.query,
		hash: from.hash,
	});
}

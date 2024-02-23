import 'vue-router';
import type { Scope } from '@/types/scopes';
export {};

declare module 'vue-router' {
	interface RouteMeta {
		title: string;
		inDrawer: boolean;
		requiresScopes?: Scope[];
	}
}

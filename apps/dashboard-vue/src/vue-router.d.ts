import 'vue-router';
import { Scope } from '@vsb-eink/facade-api-client';
export {};

declare module 'vue-router' {
	interface RouteMeta {
		title: string;
		inDrawer: boolean;
		requiredScopes?: Scope[];
	}
}

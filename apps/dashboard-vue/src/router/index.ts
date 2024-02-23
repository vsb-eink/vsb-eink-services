import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';

import DashboardView from '../views/DashboardView.vue';
import BaseLayout from '@/layouts/BaseLayout.vue';
import { Scope } from '@/types/scopes';
import { http } from '@/services/http';
import { LocalStorage, Notify, SessionStorage } from 'quasar';

export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			component: BaseLayout,
			children: [
				{
					path: '/',
					name: 'dashboard',
					component: DashboardView,
					meta: {
						title: 'Dashboard',
						inDrawer: true,
						requiresScopes: [],
					},
				},
				{
					path: '/files',
					name: 'files',
					meta: {
						title: 'Soubory',
						inDrawer: true,
						requiresScopes: [Scope.HOSTED_READ],
					},
					component: () => import('@/views/FilesView.vue'),
				},
				{
					path: '/panels',
					name: 'panels',
					meta: {
						title: 'Panely',
						inDrawer: true,
						requiresScopes: [Scope.PANELS_READ],
					},
					component: () => import('@/views/PanelsView.vue'),
				},
				{
					path: '/schedule',
					name: 'schedule',
					meta: {
						title: 'Plánovač',
						inDrawer: true,
						requiresScopes: [Scope.SCHEDULE_READ],
					},
					component: () => import('@/views/ScheduleView.vue'),
				},
				{
					path: '/users',
					name: 'users',
					meta: {
						title: 'Uživatelé',
						inDrawer: true,
						requiresScopes: [Scope.USERS_READ],
					},
					component: () => import('@/views/UsersView.vue'),
				},
				{
					path: '/user-groups',
					name: 'user-groups',
					meta: {
						title: 'Skupiny uživatelů',
						inDrawer: true,
						requiresScopes: [Scope.USERS_READ],
					},
					component: () => import('@/views/UserGroupsView.vue'),
				},
				{
					path: '/settings',
					name: 'settings',
					meta: {
						title: 'Nastavení',
						inDrawer: true,
					},
					component: () => import('@/views/SettingsView.vue'),
				},
			],
		},
		{
			path: '/login',
			name: 'login',
			meta: {
				title: 'Přihlášení',
				inDrawer: false,
			},
			component: () => import('@/views/LoginView.vue'),
		},
		{
			path: '/:catchAll(.*)',
			name: '404',
			component: () => import('@/views/NotFoundView.vue'),
		},
	],
});

const isUserAuthenticated = () => {
	return LocalStorage.has('token');
};

// Redirect to login if not authenticated
router.beforeEach((to) => {
	if (!isUserAuthenticated() && to.name !== 'login') {
		return { name: 'login' };
	}
});

export async function canUserAccess(route: RouteLocationNormalized): Promise<boolean> {
	if (!route.meta.requiresScopes || route.meta.requiresScopes.length === 0) {
		return true;
	}

	if (!SessionStorage.has('user')) {
		const user = await http.get('/profile');
		SessionStorage.set('user', user.data);
	}
	const user = SessionStorage.getItem<{ scopes: Scope[] }>('user');

	if (!user) {
		return false;
	}

	for (const requiredScope of route.meta.requiresScopes) {
		if (!user.scopes.includes(requiredScope)) {
			return false;
		}
	}

	return true;
}

// Check if user has access to route
router.beforeEach((to) => {
	if (!canUserAccess(to)) {
		Notify.create({
			type: 'negative',
			message: 'Nemáte dostatečná oprávnění',
		});
		return false;
	}
});

import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import { LocalStorage, Notify, SessionStorage } from 'quasar';

import DashboardView from '@/views/DashboardView.vue';
import MainLayout from '@/layouts/MainLayout.vue';
import { Scope } from '@/types/scopes';
import { http } from '@/services/http';

export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			component: MainLayout,
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
					path: '/panels',
					children: [
						{
							path: '',
							name: 'panels',
							meta: {
								title: 'Panely',
								inDrawer: true,
								requiresScopes: [Scope.PANELS_READ],
							},
							component: () => import('@/views/panels/PanelListView.vue'),
						},
						{
							path: ':id',
							name: 'panel-detail',
							meta: {
								title: 'Detail panelu',
								inDrawer: false,
								requiresScopes: [Scope.PANELS_READ],
							},
							component: () => import('@/views/panels/PanelDetailView.vue'),
						},
					],
				},
				{
					path: '/panel-groups',
					children: [
						{
							path: '',
							name: 'panel-groups',
							meta: {
								title: 'Skupiny panelů',
								inDrawer: true,
								requiresScopes: [Scope.PANELS_READ],
							},
							component: () => import('@/views/panels/PanelGroupListView.vue'),
						},
						{
							path: ':id',
							name: 'panel-group-detail',
							meta: {
								title: 'Detail skupiny panelů',
								inDrawer: false,
								requiresScopes: [Scope.PANELS_READ],
							},
							component: () => import('@/views/panels/PanelGroupDetailView.vue'),
						},
					],
				},
				{
					path: '/users',
					children: [
						{
							path: '',
							name: 'users',
							meta: {
								title: 'Uživatelé',
								inDrawer: true,
								requiresScopes: [Scope.USERS_READ],
							},
							component: () => import('@/views/users/UserListView.vue'),
						},
						{
							path: ':id',
							name: 'user-detail',
							meta: {
								title: 'Detail uživatele',
								inDrawer: false,
								requiresScopes: [Scope.USERS_READ],
							},
							component: () => import('@/views/users/UserDetailView.vue'),
						},
					],
				},
				{
					path: '/user-groups',
					children: [
						{
							path: '',
							name: 'user-groups',
							meta: {
								title: 'Skupiny uživatelů',
								inDrawer: true,
								requiresScopes: [Scope.USERS_READ],
							},
							component: () => import('@/views/users/UserGroupListView.vue'),
						},
						{
							path: ':id',
							name: 'user-group-detail',
							meta: {
								title: 'Detail skupiny uživatelů',
								inDrawer: false,
								requiresScopes: [Scope.USERS_READ],
							},
							component: () => import('@/views/users/UserGroupDetailView.vue'),
						},
					],
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

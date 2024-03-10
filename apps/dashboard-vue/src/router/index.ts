import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import { LocalStorage, Notify, SessionStorage } from 'quasar';

import DashboardView from '@/views/DashboardView.vue';
import MainLayout from '@/layouts/MainLayout.vue';
import { api } from '@/services/api';
import { Scope } from '@vsb-eink/facade-api-client';
import { useUserStore } from '@/composables/user-store';

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
					meta: {
						title: 'Dashboard',
						inDrawer: false,
						requiredScopes: [],
					},
					redirect: () => ({ name: 'schedule' }),
				},
				{
					path: '/schedule',
					children: [
						{
							path: '',
							name: 'schedule',
							meta: {
								title: 'Plánované úlohy',
								inDrawer: true,
								requiredScopes: [Scope.ScheduleRead],
							},
							component: () => import('@/views/schedule/ScheduledJobsListView.vue'),
						},
						{
							path: ':id',
							name: 'schedule-detail',
							props: (to) => ({ id: Number(to.params.id) }),
							meta: {
								title: 'Detail plánované úlohy',
								inDrawer: false,
								requiresScopes: [Scope.ScheduleRead],
							},
							component: () => import('@/views/schedule/ScheduledJobView.vue'),
						},
					],
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
								requiredScopes: [Scope.PanelsRead],
							},
							component: () => import('@/views/panels/PanelListView.vue'),
						},
						{
							path: ':id',
							name: 'panel-detail',
							props: (to) => ({ id: to.params.id }),
							meta: {
								title: 'Detail panelu',
								inDrawer: false,
								requiresScopes: [Scope.PanelsRead],
							},
							component: () => import('@/views/panels/PanelView.vue'),
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
								requiredScopes: [Scope.PanelsRead],
							},
							component: () => import('@/views/panels/PanelGroupListView.vue'),
						},
						{
							path: ':id',
							name: 'panel-group-detail',
							props: (to) => ({ id: to.params.id }),
							meta: {
								title: 'Detail skupiny panelů',
								inDrawer: false,
								requiresScopes: [Scope.PanelsRead],
							},
							component: () => import('@/views/panels/PanelGroupView.vue'),
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
								requiredScopes: [Scope.UsersRead],
							},
							component: () => import('@/views/users/UserListView.vue'),
						},
						{
							path: ':id',
							name: 'user-detail',
							props: (to) => ({ id: Number(to.params.id) }),
							meta: {
								title: 'Detail uživatele',
								inDrawer: false,
								requiresScopes: [Scope.UsersRead],
							},
							component: () => import('@/views/users/UserView.vue'),
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
								requiredScopes: [Scope.UsersRead],
							},
							component: () => import('@/views/users/UserGroupListView.vue'),
						},
						{
							path: ':id',
							name: 'user-group-detail',
							props: (to) => ({ id: Number(to.params.id) }),
							meta: {
								title: 'Detail skupiny uživatelů',
								inDrawer: false,
								requiresScopes: [Scope.UsersRead],
							},
							component: () => import('@/views/users/UserGroupView.vue'),
						},
					],
				},
				{
					path: '/files',
					name: 'files',
					meta: {
						title: 'Soubory',
						inDrawer: true,
						requiredScopes: [Scope.HostedRead],
					},
					component: () => import('@/views/FilesView.vue'),
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
			path: '/:pathMatch(.*)*',
			name: 'NotFound',
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
	if (!route.meta.requiredScopes || route.meta.requiredScopes.length === 0) {
		return true;
	}

	const user = useUserStore();

	if (!user.isLoggedIn || !user.profile) {
		return false;
	}

	if (!user.hasScope(...route.meta.requiredScopes)) {
		return false;
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

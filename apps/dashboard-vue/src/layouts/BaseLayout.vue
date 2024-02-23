<template>
	<q-layout>
		<q-header elevated>
			<q-toolbar>
				<q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

				<q-toolbar-title>VŠB EInk</q-toolbar-title>

				<q-btn flat @click="logout">
					<q-icon name="logout" />
					Odhlásit se
				</q-btn>
			</q-toolbar>
		</q-header>

		<q-drawer v-model="leftDrawerOpen" show-if-above bordered>
			<q-list>
				<q-item
					v-for="route in routes"
					:key="route.path"
					clickable
					tag="router-link"
					:to="route.path"
					exact
				>
					<q-item-section>
						<q-item-label>{{ route.meta.title || route.name }}</q-item-label>
					</q-item-section>
				</q-item>
			</q-list>
		</q-drawer>

		<q-page-container>
			<router-view />
		</q-page-container>
	</q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { type RouteLocationNormalized, useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { Scope } from '@/types/scopes';

const leftDrawerOpen = ref(false);

const { sessionStorage, localStorage } = useQuasar();
const router = useRouter();
const route = useRoute();

const logout = () => {
	sessionStorage.remove('user');
	localStorage.remove('token');
	router.push('/login');
};

const canAccess = (route: RouteLocationNormalized) => {
	if (route.meta.requiresAuth) {
		return localStorage.getItem('token');
	}

	const user = sessionStorage.getItem<{ scopes: Scope[] }>('user');
	if (user && route.meta.requiresScopes) {
		return user.scopes.some((scope) => route.meta.requiresScopes?.includes(scope));
	}

	return true;
};

const routes = computed(() => {
	return router.getRoutes().filter((route) => route.meta.inDrawer && canAccess(route));
});
</script>

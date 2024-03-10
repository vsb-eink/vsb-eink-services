<template>
	<q-layout>
		<q-header elevated>
			<q-toolbar class="bg-secondary">
				<q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

				<q-toolbar-title>VŠB EInk</q-toolbar-title>

				<q-btn flat @click="logoutAndRedirectToLogin">
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
					active-class="active-link"
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
import { type RouteRecordNormalized, useRouter } from 'vue-router';
import { useUserStore } from '@/composables/user-store';

const leftDrawerOpen = ref(false);

const router = useRouter();

const userStore = useUserStore();

const logoutAndRedirectToLogin = () => {
	userStore.logout();
	router.push('/login');
};

const canAccess = (route: RouteRecordNormalized) => {
	// admin can access everything
	if (userStore.isAdmin) {
		return true;
	}

	// if route requires auth and user is not logged in, they can't access it
	if (route.meta.requiresAuth && !userStore.isLoggedIn) {
		return false;
	}

	// if user is logged in and route requires scopes, check if user has them
	if (route.meta.requiredScopes) {
		return userStore.hasScope(...route.meta.requiredScopes);
	}

	return true;
};

const routes = computed(() => {
	return router.getRoutes().filter((route) => route.meta.inDrawer && canAccess(route));
});
</script>

<style lang="scss" scoped>
.active-link {
	background-color: lighten($primary, 30%);
	@if (lightness(lighten($primary, 30%)) > 40%) {
		color: black;
	} @else {
		color: white;
	}
}
</style>

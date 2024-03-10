import { computed, ref, watch } from 'vue';
import { LocalStorage, useQuasar } from 'quasar';
import { defineStore } from 'pinia';
import { type AuthenticatedUser, Role, type Scope } from '@vsb-eink/facade-api-client';

import { api } from '@/services/api';

export function getToken() {
	return LocalStorage.getItem<string>('token');
}

export const useUserStore = defineStore('user', () => {
	const { localStorage, notify } = useQuasar();

	const token = ref<string | null>(null);
	const isLoggingIn = ref(false);

	const profile = ref<AuthenticatedUser | null>(null);
	const isProfileLoading = ref(false);

	const isLoggedIn = computed(() => !!token.value && !!profile.value);
	const isAdmin = computed(() => profile.value?.role === Role.Admin);

	watch(token, (value) => {
		if (!value) localStorage.remove('token');
		else localStorage.set('token', value);
	});
	watch(profile, (value) => {
		if (!value) localStorage.remove('user');
		else localStorage.set('user', value);
	});

	const hasScope = (...scopes: Scope[]) => {
		if (!profile.value) return false;
		if (isAdmin.value) return true;
		return scopes.every((scope) => profile.value?.scopes.includes(scope));
	};

	const logout = () => {
		token.value = null;
		profile.value = null;
	};

	const reload = () => {
		token.value = localStorage.getItem('token');
		profile.value = localStorage.getItem<AuthenticatedUser>('user');
	};

	const fetchProfile = async (): Promise<AuthenticatedUser | null> => {
		if (!token.value) {
			notify({ message: 'Není možné načíst profil bez přihlášení', type: 'negative' });
			return null;
		}

		try {
			isProfileLoading.value = true;
			profile.value = await api.users.getProfile().then((res) => res.data);
			return profile.value;
		} catch (error) {
			notify({ message: 'Načtení profilu se nezdařilo', type: 'negative' });
			return null;
		} finally {
			isProfileLoading.value = false;
		}
	};

	const login = async (username: string, password: string): Promise<string | null> => {
		try {
			isLoggingIn.value = true;
			token.value = await api.auth
				.login({ username, password })
				.then((res) => res.data.token);
			return token.value;
		} catch (error) {
			notify({ message: 'Přihlášení se nezdařilo', type: 'negative' });
			return null;
		} finally {
			isLoggingIn.value = false;
		}
	};

	reload();

	return {
		token,
		profile,
		isProfileLoading,
		isLoggedIn,
		isAdmin,
		hasScope,
		logout,
		reload,
		login,
		fetchProfile,
	};
});

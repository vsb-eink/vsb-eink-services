<template>
	<q-layout>
		<q-header elevated>
			<q-toolbar class="bg-secondary">
				<q-toolbar-title>VŠB EInk - Dashboard</q-toolbar-title>
			</q-toolbar>
		</q-header>

		<q-page-container>
			<q-page padding>
				<q-card>
					<q-card-section>
						<q-form @submit="loginAndRedirectToHome" @reset="reset">
							<q-input v-model="username" name="username" label="Uživatelské jméno" />
							<q-input
								v-model="password"
								name="password"
								label="Heslo"
								type="password"
							/>
							<q-btn
								class="q-mt-lg"
								type="submit"
								label="Přihlásit"
								color="primary"
							/>
						</q-form>
					</q-card-section>
				</q-card>
			</q-page>
		</q-page-container>
	</q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/composables/user-store';

const router = useRouter();

const { login, fetchProfile } = useUserStore();

const username = ref('');
const password = ref('');

const loginAndRedirectToHome = async () => {
	const token = await login(username.value, password.value);
	const profile = await fetchProfile();

	if (token && profile) {
		await router.push({ name: 'dashboard' });
	}
};

const reset = () => {
	username.value = '';
	password.value = '';
};
</script>

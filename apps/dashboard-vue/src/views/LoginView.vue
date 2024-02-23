<template>
	<q-layout>
		<q-header elevated>
			<q-toolbar>
				<q-toolbar-title>VŠB EInk - Dashboard</q-toolbar-title>
			</q-toolbar>
		</q-header>

		<q-page-container>
			<q-page padding>
				<q-card>
					<q-card-section>
						<q-form @submit="login" @reset="reset">
							<q-input v-model="username" name="username" label="Uživatelské jméno" />
							<q-input
								v-model="password"
								name="password"
								label="Heslo"
								type="password"
							/>
							<q-btn type="submit" label="Přihlásit" color="primary" />
						</q-form>
					</q-card-section>
				</q-card>
			</q-page>
		</q-page-container>
	</q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { http } from '@/services/http';
import { router } from '@/router';

const { notify } = useQuasar();

const username = ref('');
const password = ref('');

const login = async () => {
	try {
		const res = await http.post('/auth/login', {
			username: username.value,
			password: password.value,
		});

		if (res.data.token) {
			localStorage.setItem('token', res.data.token);
		}

		notify({
			message: 'Přihlášení proběhlo úspěšně',
			color: 'positive',
		});

		await router.push('/');
	} catch (error) {
		console.error(error);
	}
};

const reset = () => {
	username.value = '';
	password.value = '';
};
</script>

<template>
	<q-page padding>
		<q-card>
			<q-card-section>
				<q-toolbar>
					<q-toolbar-title>
						<span v-if="userIsReady">{{ user.username }}</span>
						<q-skeleton v-else></q-skeleton>
					</q-toolbar-title>
					<q-space />
					<q-btn flat rounded dense icon="refresh" @click="refresh" />
				</q-toolbar>
			</q-card-section>
		</q-card>

		<q-card class="q-mt-lg">
			<q-card-section>
				<q-list>
					<q-item>
						<q-item-section>
							<q-item-label>Username</q-item-label>
						</q-item-section>
						<q-item-section side>
							<q-item-label v-if="userIsReady">{{ user.username }}</q-item-label>
							<q-skeleton v-else></q-skeleton>
						</q-item-section>
					</q-item>

					<q-item>
						<q-item-section>
							<q-item-label>Role</q-item-label>
						</q-item-section>
						<q-item-section side>
							<q-item-label v-if="userIsReady">{{ user.role }}</q-item-label>
							<q-skeleton v-else></q-skeleton>
						</q-item-section>
					</q-item>

					<q-item>
						<q-item-section>
							<q-item-label>Uživatelské skupiny</q-item-label>
						</q-item-section>
						<q-item-section>
							<q-select
								v-if="userIsReady && groupsAreReady"
								v-model="user.groups"
								:options="groups"
								option-label="name"
								use-chips
								multiple
							/>
							<q-skeleton v-else></q-skeleton>
						</q-item-section>
					</q-item>
				</q-list>
			</q-card-section>
		</q-card>
	</q-page>
</template>

<script setup lang="ts">
import { http } from '@/services/http';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';

const route = useRoute();

const user = ref(null);
const userIsReady = ref(false);

const groups = ref([]);
const groupsAreReady = ref(false);

const refresh = async () => {
	try {
		user.value = await http.get(`/users/${route.params.id}`).then((res) => res.data);
		userIsReady.value = true;

		groups.value = await http
			.get('/user-groups')
			.then((res) => res.data.map((group) => ({ id: group.id, name: group.name })));
		groupsAreReady.value = true;
	} catch (e) {
		console.error(e);
	}
};

onMounted(async () => {
	await refresh();
});

onBeforeRouteUpdate(async () => {
	userIsReady.value = false;
	groupsAreReady.value = false;
	await refresh();
});
</script>

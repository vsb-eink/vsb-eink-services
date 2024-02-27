<template>
	<q-page padding>
		<q-card>
			<q-card-section>
				<q-toolbar>
					<q-toolbar-title>
						<span v-if="groupIsReady">{{ group.name }}</span>
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
							<q-item-label>Název</q-item-label>
						</q-item-section>
						<q-item-section side>
							<q-item-label v-if="groupIsReady">{{ group.name }}</q-item-label>
							<q-skeleton v-else></q-skeleton>
						</q-item-section>
					</q-item>

					<q-item>
						<q-item-section>
							<q-item-label>Uživatelé</q-item-label>
						</q-item-section>
						<q-item-section>
							<q-select
								v-if="groupIsReady && usersAreReady"
								v-model="group.users"
								:options="users"
								option-label="username"
								use-chips
								multiple
							/>
							<q-skeleton v-else></q-skeleton>
						</q-item-section>
					</q-item>

					<q-item>
						<q-item-section>
							<q-item-label>Skupiny panelů</q-item-label>
						</q-item-section>
						<q-item-section>
							<q-select
								v-if="groupIsReady && panelGroupsAreReady"
								v-model="group.managedPanelGroups"
								:options="panelGroups"
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

		<q-card>
			<q-card-section>
				<q-markup-table>
					<thead>
						<tr>
							<th>Operace</th>
							<th>Plánovač</th>
							<th>Uživatelé</th>
							<th>Panely</th>
							<th>Soubory</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Čtení</td>
							<td class="text-center">x</td>
							<td class="text-center">x</td>
							<td class="text-center">x</td>
							<td class="text-center">x</td>
						</tr>
						<tr>
							<td>Zápis</td>
							<td class="text-center">x</td>
							<td class="text-center">x</td>
							<td class="text-center">x</td>
							<td class="text-center">x</td>
						</tr>
					</tbody>
				</q-markup-table>
			</q-card-section>
		</q-card>
	</q-page>
</template>

<script setup lang="ts">
import { http } from '@/services/http';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';

const route = useRoute();

const group = ref(null);
const groupIsReady = ref(false);

const users = ref([]);
const usersAreReady = ref(false);

const panelGroups = ref([]);
const panelGroupsAreReady = ref(false);

const refresh = async () => {
	try {
		group.value = await http.get(`/user-groups/${route.params.id}`).then((res) => res.data);
		groupIsReady.value = true;

		users.value = await http
			.get('/users')
			.then((res) => res.data.map((user) => ({ id: user.id, username: user.username })));
		usersAreReady.value = true;

		panelGroups.value = await http
			.get('/panel-groups')
			.then((res) => res.data.map((pg) => ({ id: pg.id, name: pg.name })));
		panelGroupsAreReady.value = true;
	} catch (e) {
		console.error(e);
	}
};

onMounted(async () => {
	await refresh();
});

onBeforeRouteUpdate(async () => {
	groupIsReady.value = false;
	usersAreReady.value = false;
	panelGroupsAreReady.value = false;
	await refresh();
});
</script>

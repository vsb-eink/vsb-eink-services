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
							<q-item-label>Vlastníci skupiny</q-item-label>
						</q-item-section>
						<q-item-section>
							<q-select
								v-if="groupIsReady && userGroupsAreReady"
								v-model="group.managedBy"
								:options="userGroups"
								option-label="name"
								use-chips
								multiple
							/>
							<q-skeleton v-else></q-skeleton>
						</q-item-section>
					</q-item>

					<q-item>
						<q-item-section>
							<q-item-label>Panely</q-item-label>
						</q-item-section>
						<q-item-section>
							<q-select
								v-if="groupIsReady && panelsAreReady"
								v-model="group.panels"
								:options="panels"
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

const group = ref(null);
const groupIsReady = ref(false);

const panels = ref([]);
const panelsAreReady = ref(false);

const userGroups = ref([]);
const userGroupsAreReady = ref(false);

const refresh = async () => {
	try {
		group.value = await http.get(`/panel-groups/${route.params.id}`).then((res) => res.data);
		groupIsReady.value = true;

		panels.value = await http
			.get('/panels')
			.then((res) => res.data.map((panel) => ({ id: panel.id, name: panel.name })));
		panelsAreReady.value = true;

		userGroups.value = await http
			.get('/user-groups')
			.then((res) => res.data.map((ug) => ({ id: ug.id, name: ug.name })));
		userGroupsAreReady.value = true;
	} catch (e) {
		console.error(e);
	}
};

onMounted(async () => {
	await refresh();
});

onBeforeRouteUpdate(async () => {
	groupIsReady.value = false;
	panelsAreReady.value = false;
	userGroupsAreReady.value = false;
	await refresh();
});
</script>

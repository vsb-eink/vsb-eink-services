<template>
	<q-page padding>
		<q-card>
			<q-card-section class="q-pa-none">
				<q-toolbar>
					<q-toolbar-title>Panely</q-toolbar-title>
					<q-space />
					<q-btn
						flat
						round
						dense
						@click="refresh()"
						icon="refresh"
						title="Aktualizovat"
					/>
				</q-toolbar>
			</q-card-section>

			<q-card-section>
				<q-table flat :columns="columns" :rows="panels" @rowClick="onRowClick">
					<template v-slot:body-cell-groups="props">
						<q-td key="groups" :props="props">
							<q-chip v-bind:key="group.id" v-for="group in props.row.groups">
								{{ group.name }}
							</q-chip>
						</q-td>
					</template>
				</q-table>
			</q-card-section>
		</q-card>

		<q-dialog v-model="newPanelDialogVisible">
			<q-card>
				<q-card-section>
					<div class="text-h6">Nový panel</div>
				</q-card-section>
				<q-card-section>
					<q-input v-model="newPanelId" label="ID panelu"></q-input>
					<q-input v-model="newPanelName" label="Název panelu" />
				</q-card-section>
				<q-card-actions align="right">
					<q-btn
						flat
						label="OK"
						color="primary"
						@click="createNewPanel(newPanelId, newPanelName)"
					/>
				</q-card-actions>
			</q-card>
		</q-dialog>

		<q-page-sticky position="bottom-right" :offset="[18, 18]">
			<q-btn @click="openNewPanelDialog" fab icon="add" color="accent" />
		</q-page-sticky>
	</q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '@/services/http';

const router = useRouter();

const newPanelDialogVisible = ref(false);
const newPanelId = ref('');
const newPanelName = ref('');

const panels = ref([]);
const columns = [
	{
		name: 'id',
		label: 'ID',
		align: 'left',
		field: 'id',
	},
	{
		name: 'name',
		label: 'Název',
		align: 'left',
		field: 'name',
	},
	{
		name: 'groups',
		label: 'Skupiny panelů',
		align: 'left',
		field: 'groups',
	},
];

onMounted(async () => {
	await refresh();
});

const refresh = async () => {
	try {
		const res = await http.get('/panels');
		panels.value = res.data;
	} catch (error) {
		console.error(error);
	}
};

const openNewPanelDialog = () => {
	newPanelId.value = '';
	newPanelName.value = '';
	newPanelDialogVisible.value = true;
};

const createNewPanel = async (id: string, name: string) => {
	try {
		await http.post('/panels', { id, name: name || undefined });
		newPanelDialogVisible.value = false;
		await refresh();
	} catch (error) {
		console.error(error);
	}
};

const onRowClick = (event, row) => {
	router.push({ name: 'panel-detail', params: { id: row.id } });
};
</script>

<style scoped></style>

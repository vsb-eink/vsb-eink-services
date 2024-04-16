<template>
	<q-page padding>
		<q-card>
			<q-card-section class="q-pa-none">
				<q-toolbar>
					<q-toolbar-title>Panely</q-toolbar-title>
					<q-space />
					<q-btn flat round dense @click="pullData" icon="refresh" title="Aktualizovat" />
				</q-toolbar>
			</q-card-section>

			<q-card-section>
				<q-table
					flat
					:loading="loading"
					:columns="columns"
					:pagination="pagination"
					:rows="panels"
					@rowClick="onRowClick"
				>
					<template v-slot:body-cell-groups="props">
						<q-td :props>
							<q-chip
								v-for="group in props.row.groups"
								:key="group.id"
								:label="group.name"
							/>
						</q-td>
					</template>

					<template v-slot:body-cell-actions="props">
						<q-td :props>
							<q-btn-dropdown
								@click.stop
								flat
								rounded
								dense
								no-icon-animation
								dropdown-icon="more_vert"
							>
								<q-list>
									<q-item clickable v-close-popup @click="deletePanel(props.row)">
										<q-item-section>Smazat</q-item-section>
									</q-item>
								</q-list>
							</q-btn-dropdown>
						</q-td>
					</template>
				</q-table>
			</q-card-section>
		</q-card>

		<q-dialog v-model="panelForm._visible">
			<q-card class="dialog-window">
				<q-form greedy @submit="submitPanelForm">
					<q-card-section>
						<div class="text-h6">Nový panel</div>
					</q-card-section>
					<q-card-section>
						<q-input
							v-model="panelForm.id"
							label="ID panelu"
							:rules="[isNotEmpty, isAlphaNumeric, isLowerCase, doesNotContainSpaces]"
						></q-input>
						<q-input
							v-model="panelForm.name"
							label="Název panelu"
							:rules="[isNotEmpty]"
						/>
					</q-card-section>
					<q-card-actions align="right">
						<q-btn flat type="submit" label="OK" color="primary" />
					</q-card-actions>
				</q-form>
			</q-card>
		</q-dialog>

		<q-page-sticky position="bottom-right" :offset="[18, 18]">
			<q-btn @click="openPanelForm" fab icon="add" color="primary" />
		</q-page-sticky>
	</q-page>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import type { Panel } from '@vsb-eink/facade-api-client';
import { type QTableColumn, type QTableProps, useQuasar } from 'quasar';
import { doesNotContainSpaces, isAlphaNumeric, isLowerCase, isNotEmpty } from '@/utils/validators';

const router = useRouter();
const { notify } = useQuasar();

const panelForm = reactive({
	_visible: false,
	id: '',
	name: '',
});

const panels = ref<Panel[]>([]);
const pagination: QTableProps['pagination'] = {
	descending: true,
	sortBy: 'name',
};
const columns: QTableColumn[] = [
	{
		name: 'name',
		label: 'Název',
		align: 'left',
		field: 'name',
		sortable: true,
	},
	{
		name: 'groups',
		label: 'Skupiny panelů',
		align: 'left',
		field: 'groups',
	},
	{
		name: 'actions',
		align: 'right',
		label: '',
		field: '',
	},
];
const loading = ref(true);

const openPanelForm = () => {
	panelForm.id = '';
	panelForm.name = '';
	panelForm._visible = true;
};

const submitPanelForm = async () => {
	try {
		const { id, name } = panelForm;
		await api.panels.createPanel({ id, name });
		panelForm._visible = false;
		return router.push({ name: 'panel-detail', params: { id } });
	} catch (error) {
		notify({ message: 'Nepodařilo se vytvořit panel', color: 'negative' });
	}
};

const deletePanel = async (panel: Panel) => {
	try {
		await api.panels.deletePanel(panel.id);
		notify({ message: 'Panel byl smazán', color: 'positive' });
		await pullData();
	} catch (error) {
		notify({ message: 'Nepodařilo se smazat panel', color: 'negative' });
	}
};

const pullData = async () => {
	try {
		loading.value = true;
		panels.value = await api.panels.getPanels().then((res) => res.data);
	} catch (error) {
		notify({ message: 'Nepodařilo se načíst seznam panelů', color: 'negative' });
	} finally {
		loading.value = false;
	}
};

const onRowClick = (event: Event, panel: Panel) => {
	router.push({ name: 'panel-detail', params: { id: panel.id } });
};

onBeforeMount(() => pullData());
</script>

<style scoped></style>

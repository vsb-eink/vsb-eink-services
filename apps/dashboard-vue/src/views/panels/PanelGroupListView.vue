<template>
	<q-page padding>
		<q-card>
			<q-card-section class="q-pa-none">
				<q-toolbar>
					<q-toolbar-title>Skupiny</q-toolbar-title>
					<q-space />
					<q-btn flat round dense @click="pullData" icon="refresh" title="Aktualizovat" />
				</q-toolbar>
			</q-card-section>

			<q-card-section>
				<q-table
					flat
					:loading="panelGroups.length === 0"
					:pagination="panelGroupsPagination"
					:columns="panelGroupsColumns"
					:rows="panelGroups"
					@rowClick="onRowClick"
				>
					<template v-slot:body-cell-managedBy="props">
						<q-td :props>
							<q-chip
								v-for="group in props.row.managedBy"
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
									<q-item
										clickable
										v-close-popup
										@click="deletePanelGroup(props.row)"
									>
										<q-item-section>Smazat</q-item-section>
									</q-item>
								</q-list>
							</q-btn-dropdown>
						</q-td>
					</template>
				</q-table>
			</q-card-section>
		</q-card>

		<q-dialog v-model="panelGroupForm._visible">
			<q-card class="dialog-window">
				<q-form greedy @submit="submitPanelGroupForm">
					<q-card-section>
						<div class="text-h6">Nová skupina panelů</div>
					</q-card-section>
					<q-card-section>
						<q-input
							v-model="panelGroupForm.id"
							label="ID skupiny"
							:rules="[isNotEmpty]"
						></q-input>
						<q-input
							v-model="panelGroupForm.name"
							label="Název skupiny"
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
			<q-btn @click="openPanelGroupForm" fab icon="add" color="primary" />
		</q-page-sticky>
	</q-page>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { PanelGroup } from '@vsb-eink/facade-api-client';
import { type QTableColumn, type QTableProps, useQuasar } from 'quasar';
import { api } from '@/services/api';
import { isNotEmpty } from '@/utils/validators';

const router = useRouter();
const { notify } = useQuasar();

const panelGroupForm = reactive({
	_visible: false,
	id: '',
	name: '',
});

const panelGroups = ref<PanelGroup[]>([]);
const panelGroupsPagination: QTableProps['pagination'] = {
	descending: true,
	sortBy: 'name',
};
const panelGroupsColumns: QTableColumn[] = [
	{
		name: 'name',
		label: 'Název',
		align: 'left',
		field: 'name',
		sortable: true,
	},
	{
		name: 'managedBy',
		label: 'Vlastníci',
		align: 'left',
		field: 'managedBy',
	},
	{
		name: 'actions',
		align: 'right',
		label: '',
		field: '',
	},
];

const openPanelGroupForm = () => {
	panelGroupForm.name = '';
	panelGroupForm._visible = true;
};

const submitPanelGroupForm = async () => {
	try {
		const { id, name } = panelGroupForm;
		await api.panels.createPanelGroup({ id, name });
		panelGroupForm._visible = false;
		notify({
			message: 'Skupina panelů byla vytvořena',
			color: 'positive',
		});
		return router.push({ name: 'panel-group-detail', params: { id } });
	} catch (error) {
		notify({
			message: 'Nepodařilo se vytvořit skupinu panelů',
			color: 'negative',
		});
	}
};

const deletePanelGroup = async (panelGroup: PanelGroup) => {
	try {
		await api.panels.deletePanelGroup(panelGroup.id);
		notify({
			message: 'Skupina panelů byla smazána',
			color: 'positive',
		});
		await pullData();
	} catch (error) {
		notify({
			message: 'Nepodařilo se smazat skupinu panelů',
			color: 'negative',
		});
	}
};

const pullData = async () => {
	try {
		panelGroups.value = await api.panels.getPanelGroups().then((res) => res.data);
	} catch (error) {
		notify({
			message: 'Nepodařilo se načíst skupiny panelů',
			color: 'negative',
		});
	}
};

const onRowClick = (event: Event, panelGroup: PanelGroup) => {
	router.push({ name: 'panel-group-detail', params: { id: panelGroup.id } });
};

onBeforeMount(() => pullData());
</script>

<style scoped></style>

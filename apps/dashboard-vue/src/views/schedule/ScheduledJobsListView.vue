<template>
	<q-page padding>
		<q-card>
			<q-card-section class="q-pa-none">
				<q-toolbar>
					<q-toolbar-title>Plánované úlohy</q-toolbar-title>
					<q-space />
					<q-btn flat round dense @click="pullData" icon="refresh" title="Aktualizovat" />
				</q-toolbar>
			</q-card-section>

			<q-card-section>
				<q-table
					flat
					:loading="loading"
					:grid="$q.screen.xs"
					:rows="jobs"
					:pagination="pagination"
					:columns="columns"
					@rowClick="onRowClick"
				>
					<template v-slot:item="props">
						<StylableTableCardItem :props="props" />
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
									<q-item clickable v-close-popup @click="deleteJob(props.row)">
										<q-item-section>Smazat</q-item-section>
									</q-item>
								</q-list>
							</q-btn-dropdown>
						</q-td>
					</template>
				</q-table>
			</q-card-section>
		</q-card>

		<q-page-sticky position="bottom-right" :offset="[18, 18]">
			<q-btn @click="submitJobForm" fab icon="add" color="primary" />
		</q-page-sticky>
	</q-page>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { type QTableColumn, type QTableProps, useQuasar } from 'quasar';

import type { ScheduledJob } from '@vsb-eink/facade-api-client';
import { api } from '@/services/api';
import StylableTableCardItem from '@/components/StylableTableCardItem.vue';

const router = useRouter();
const { notify } = useQuasar();

const jobs = ref<ScheduledJob[]>([]);
const pagination: QTableProps['pagination'] = {
	descending: true,
	sortBy: 'name',
};
const columns: QTableColumn<ScheduledJob>[] = [
	{
		name: 'name',
		label: 'Název',
		field: 'name',
		align: 'left',
		sortable: true,
	},
	{
		name: 'target',
		label: 'Cíl',
		field: 'target',
		align: 'left',
		sortable: true,
	},
	{
		name: 'cron',
		label: 'Cron výraz',
		field: 'cron',
		align: 'left',
		sortable: true,
	},
	{
		name: 'command',
		label: 'Příkaz',
		align: 'left',
		field: 'command',
		format: (command) => command.split('/').at(0),
		sortable: true,
	},
	{
		name: 'enabled',
		label: 'Aktivní',
		field: 'disabled',
		align: 'left',
		style: 'font-family: "Material Icons"; font-size: 18px;',
		format: (disabled) => (!disabled ? '\ue86c' : '\uef4a'),
		sortable: true,
	},
	{
		name: 'actions',
		align: 'right',
		label: '',
		field: '' as any,
	},
];
const loading = ref(true);

const submitJobForm = async () => {
	return router.push({ name: 'schedule-detail', params: { id: -1 } });
};

const deleteJob = async (job: ScheduledJob) => {
	try {
		await api.schedule.deleteScheduledJob(job.id);
		notify({ message: 'Plánovaná úloha byla smazána', color: 'positive' });
		await pullData();
	} catch (error) {
		notify({ message: 'Nepodařilo se smazat plánovanou úlohu', color: 'negative' });
	}
};

const onRowClick = (event: Event, job: ScheduledJob) => {
	router.push({ name: 'schedule-detail', params: { id: job.id } });
};

const pullData = async () => {
	try {
		loading.value = true;
		jobs.value = await api.schedule.getScheduledJobs().then((res) => res.data);
	} catch (error) {
		notify({ message: 'Nepodařilo se načíst seznam plánovaných úloh', color: 'negative' });
	} finally {
		loading.value = false;
	}
};

onBeforeMount(() => pullData());
</script>

<style scoped></style>

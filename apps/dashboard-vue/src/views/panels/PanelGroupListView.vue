<template>
	<q-page padding>
		<q-table
			title="Skupiny"
			:loading="panelGroupsLoading"
			:columns="userGroupsColumns"
			:rows="panelGroups"
			@rowClick="onRowClick"
		>
			<template v-slot:body-cell-managedBy="props">
				<q-td key="managedBy" :props="props">
					<q-chip v-bind:key="group.id" v-for="group in props.row.managedBy">
						{{ group.name }}
					</q-chip>
				</q-td>
			</template>
		</q-table>
	</q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '@/services/http';
import ScopeBadges from '@/components/ScopeBadges.vue';

const router = useRouter();

const panelGroupsLoading = ref(true);
const panelGroups = ref([]);
const userGroupsColumns = [
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
		name: 'managedBy',
		label: 'Vlastníci',
		align: 'left',
		field: 'managedBy',
	},
];

onMounted(async () => {
	const resGroups = await http.get('/panel-groups');
	panelGroups.value = resGroups.data;
	panelGroupsLoading.value = false;
});

const onRowClick = (event, panelGroup) => {
	router.push({ name: 'panel-group-detail', params: { id: panelGroup.id } });
};
</script>

<style scoped></style>

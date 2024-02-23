<template>
	<q-page padding>
		<q-table
			title="Skupiny"
			:loading="userGroupsLoading"
			:columns="userGroupsColumns"
			:rows="userGroups"
		>
			<template v-slot:body="props">
				<q-tr :props="props">
					<q-td key="id" :props="props">
						{{ props.row.id }}
					</q-td>

					<q-td key="name" :props="props">
						{{ props.row.name }}
					</q-td>

					<q-td key="panel-groups" :props="props">
						<q-chip v-bind:key="group.id" v-for="group in props.row.panelGroups">
							{{ group.name }}
						</q-chip>
					</q-td>

					<q-td key="scopes" :props="props">
						<q-chip v-bind:key="scope" v-for="scope in props.row.scopes">
							{{ scope }}
						</q-chip>
					</q-td>
				</q-tr>
			</template>
		</q-table>
	</q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { http } from '@/services/http';

const userGroupsLoading = ref(true);
const userGroups = ref([]);
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
		name: 'panel-groups',
		label: 'Skupiny panelů',
		align: 'left',
		field: 'panelGroups',
	},
	{
		name: 'scopes',
		label: 'Oprávnění',
		align: 'left',
		field: 'scopes',
	},
];

onMounted(async () => {
	const resGroups = await http.get('/user-groups');
	userGroups.value = resGroups.data;
	userGroupsLoading.value = false;
});
</script>

<style scoped></style>

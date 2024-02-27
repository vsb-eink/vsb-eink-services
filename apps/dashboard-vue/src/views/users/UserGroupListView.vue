<template>
	<q-page padding>
		<q-table
			title="Skupiny"
			:loading="userGroupsLoading"
			:columns="userGroupsColumns"
			:rows="userGroups"
			@rowClick="onRowClick"
		>
			<template v-slot:body-cell-scopes="props">
				<q-td key="scopes" :props="props">
					<ScopeBadges :scopes="props.row.scopes" />
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

const onRowClick = (event, userGroup) => {
	router.push({ name: 'user-group-detail', params: { id: userGroup.id } });
};
</script>

<style scoped></style>

<template>
	<q-page padding>
		<q-table
			title="Uživatelé"
			:loading="usersLoading"
			:columns="usersColumns"
			:rows="users"
			:grid="$q.screen.xs"
			@rowClick="onRowClick"
		>
			<template v-slot:body-cell-groups="props">
				<q-td key="groups" :props="props">
					<q-chip v-bind:key="group.id" v-for="group in props.row.groups">
						{{ group.name }}
					</q-chip>
				</q-td>
			</template>
		</q-table>
	</q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { http } from '@/services/http';
import { useRouter } from 'vue-router';

const router = useRouter();

const usersLoading = ref(true);
const users = ref([]);
const usersColumns = [
	{
		name: 'id',
		label: 'ID',
		align: 'left',
		field: 'id',
	},
	{
		name: 'username',
		label: 'Uživatelské jméno',
		align: 'left',
		field: 'username',
	},
	{
		name: 'role',
		label: 'Role',
		align: 'left',
		field: 'role',
	},
	{
		name: 'groups',
		label: 'Už. skupiny',
		align: 'left',
		field: 'groups',
		format(groups: { name: string }[]) {
			return groups.map((group) => group.name).join(', ');
		},
	},
];

onMounted(async () => {
	const res = await http.get('/users');
	users.value = res.data;
	usersLoading.value = false;
});

const onRowClick = (event, user) => {
	router.push({ name: 'user-detail', params: { id: user.id } });
};
</script>

<style scoped></style>

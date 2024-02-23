<template>
	<q-page padding>
		<q-table title="Uživatelé" :loading="usersLoading" :columns="usersColumns" :rows="users">
			<template v-slot:body="props">
				<q-tr :props="props">
					<q-td key="id" :props="props">
						{{ props.row.id }}
					</q-td>

					<q-td key="username" :props="props">
						{{ props.row.username }}
					</q-td>

					<q-td key="role" :props="props">
						{{ props.row.role }}
					</q-td>

					<q-td key="groups" :props="props">
						<q-chip v-bind:key="group.id" v-for="group in props.row.groups">
							{{ group.name }}
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
		label: 'Skupiny',
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
</script>

<style scoped></style>

<template>
	<q-page padding>
		<q-table title="Panely" :columns="columns" :rows="panels">
			<template v-slot:body="props">
				<q-tr :props="props">
					<q-td key="id" :props="props">
						{{ props.row.name }}
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

const panels = ref([]);
const columns = [
	{
		name: 'id',
		label: 'ID',
		align: 'left',
		field: 'name',
	},
	{
		name: 'groups',
		label: 'Skupiny',
		align: 'left',
		field: 'groups',
	},
];

onMounted(async () => {
	try {
		const res = await http.get('/panels');
		panels.value = res.data;
	} catch (error) {
		console.error(error);
	}
});
</script>

<style scoped></style>

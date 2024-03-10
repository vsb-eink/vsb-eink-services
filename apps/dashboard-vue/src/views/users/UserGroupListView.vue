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
					:loading="userGroups.length === 0"
					:pagination="userGroupsPagination"
					:columns="userGroupsColumns"
					:rows="userGroups"
					@rowClick="onRowClick"
				>
					<template v-slot:body-cell-scopes="props">
						<q-td :props>
							<ScopeBadges :scopes="props.row.scopes" />
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
										@click="deleteUserGroup(props.row)"
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

		<q-dialog v-model="userGroupForm._visible">
			<q-card class="dialog-window">
				<q-form greedy @submit="submitUserGroupForm">
					<q-card-section>
						<div class="text-h6">Nová skupina uživatelů</div>
					</q-card-section>
					<q-card-section>
						<q-input
							v-model="userGroupForm.name"
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
			<q-btn @click="openUserGroupForm" fab icon="add" color="primary" />
		</q-page-sticky>
	</q-page>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { type QTableColumn, type QTableProps, useQuasar } from 'quasar';
import type { UserGroup } from '@vsb-eink/facade-api-client';

import { api } from '@/services/api';
import ScopeBadges from '@/components/ScopeBadges.vue';
import { isNotEmpty } from '@/utils/validators';

const router = useRouter();
const { notify } = useQuasar();

const userGroupForm = reactive({
	_visible: false,
	name: '',
});

const userGroups = ref<UserGroup[]>([]);
const userGroupsPagination: QTableProps['pagination'] = {
	descending: true,
	sortBy: 'name',
};
const userGroupsColumns: QTableColumn[] = [
	{
		name: 'name',
		label: 'Název',
		align: 'left',
		field: 'name',
		sortable: true,
	},
	{
		name: 'scopes',
		label: 'Oprávnění',
		align: 'left',
		field: 'scopes',
	},
	{
		name: 'actions',
		align: 'right',
		label: '',
		field: '',
	},
];

const openUserGroupForm = () => {
	userGroupForm.name = '';
	userGroupForm._visible = true;
};

const submitUserGroupForm = async () => {
	try {
		const createdGroup = await api.users
			.createUserGroup({ name: userGroupForm.name })
			.then((res) => res.data);
		userGroupForm._visible = false;
		return router.push({ name: 'user-group-detail', params: { id: createdGroup.id } });
	} catch (error) {
		notify({ message: 'Nepodařilo se vytvořit skupinu', color: 'negative' });
	}
};

const deleteUserGroup = async (userGroup: UserGroup) => {
	try {
		await api.users.deleteUserGroup(userGroup.id);
		notify({ message: 'Skupina byla smazána', color: 'positive' });
		await pullData();
	} catch (error) {
		notify({ message: 'Nepodařilo se smazat skupinu', color: 'negative' });
	}
};

const pullData = async () => {
	try {
		userGroups.value = await api.users.getUserGroups().then((res) => res.data);
	} catch (error) {
		notify({ message: 'Nepodařilo se načíst skupiny', color: 'negative' });
	}
};

const onRowClick = (event: Event, userGroup: UserGroup) => {
	router.push({ name: 'user-group-detail', params: { id: userGroup.id } });
};

onBeforeMount(() => pullData());
</script>

<style scoped></style>

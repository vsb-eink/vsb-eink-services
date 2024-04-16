<template>
	<q-page padding>
		<q-card>
			<q-card-section class="q-pa-none">
				<q-toolbar>
					<q-toolbar-title>Uživatelé</q-toolbar-title>
					<q-space />
					<q-btn flat round dense @click="pullData" icon="refresh" title="Aktualizovat" />
				</q-toolbar>
			</q-card-section>

			<q-card-section>
				<q-table
					flat
					:columns="usersColumns"
					:pagination="usersPagination"
					:rows="users"
					:loading="loading"
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
									<q-item clickable v-close-popup @click="deleteUser(props.row)">
										<q-item-section>Smazat</q-item-section>
									</q-item>
								</q-list>
							</q-btn-dropdown>
						</q-td>
					</template>
				</q-table>
			</q-card-section>
		</q-card>

		<q-dialog v-model="userForm._visible">
			<q-card class="dialog-window">
				<q-form greedy @submit="submitUserForm">
					<q-card-section>
						<div class="text-h6">Nový uživatel</div>
					</q-card-section>
					<q-card-section>
						<q-input
							label="Přihlašovací jméno"
							v-model="userForm.username"
							:rules="[isNotEmpty, isAlphaNumeric, isLowerCase, doesNotContainSpaces]"
						/>
						<q-input
							label="Heslo"
							type="password"
							v-model="userForm.password"
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
			<q-btn @click="openUserForm" fab icon="add" color="primary" />
		</q-page-sticky>
	</q-page>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive, ref } from 'vue';
import { api } from '@/services/api';
import { useRouter } from 'vue-router';
import { type QTableColumn, type QTableProps, useQuasar } from 'quasar';
import type { User } from '@vsb-eink/facade-api-client';
import { doesNotContainSpaces, isAlphaNumeric, isLowerCase, isNotEmpty } from '@/utils/validators';

const router = useRouter();
const { notify } = useQuasar();

const userForm = reactive({
	_visible: false,
	username: '',
	password: '',
});

const users = ref<User[]>([]);
const usersPagination: QTableProps['pagination'] = {
	descending: true,
	sortBy: 'username',
};
const usersColumns: QTableColumn[] = [
	{
		name: 'username',
		label: 'Uživatelské jméno',
		align: 'left',
		field: 'username',
		sortable: true,
	},
	{
		name: 'role',
		label: 'Role',
		align: 'left',
		field: 'role',
		sortable: true,
	},
	{
		name: 'groups',
		label: 'Už. skupiny',
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

const openUserForm = () => {
	userForm.username = '';
	userForm.password = '';
	userForm._visible = true;
};

const submitUserForm = async () => {
	try {
		const { username, password } = userForm;
		const createdUser = await api.users
			.createUser({ username, password })
			.then((res) => res.data);
		userForm._visible = false;
		notify({
			message: 'Uživatel byl vytvořen',
			color: 'positive',
		});
		return router.push({ name: 'user-detail', params: { id: createdUser.id } });
	} catch (error) {
		notify({
			message: 'Nepodařilo se vytvořit uživatele',
			color: 'negative',
		});
	}
};

const deleteUser = async (user: User) => {
	try {
		await api.users.deleteUser(user.id);
		notify({
			message: 'Uživatel byl smazán',
			color: 'positive',
		});
		await pullData();
	} catch (error) {
		notify({
			message: 'Nepodařilo se smazat uživatele',
			color: 'negative',
		});
	}
};

const pullData = async () => {
	try {
		loading.value = true;
		users.value = await api.users.getUsers().then((res) => res.data);
	} catch (error) {
		notify({
			message: 'Nepodařilo se načíst uživatele',
			color: 'negative',
		});
	} finally {
		loading.value = false;
	}
};

const onRowClick = (event: Event, user: User) => {
	router.push({ name: 'user-detail', params: { id: user.id } });
};

onBeforeMount(() => pullData());
</script>

<style scoped></style>

<template>
	<q-page padding>
		<q-form
			@submit="pushData"
			@reset="pullData"
			@validationError="validationErrorNotification"
			greedy
		>
			<q-card>
				<q-card-section>
					<q-toolbar>
						<q-toolbar-title>
							<span v-if="localData">{{ localData.name }}</span>
							<q-skeleton v-else type="text" />
						</q-toolbar-title>
						<q-space />
						<q-btn type="reset" flat rounded dense icon="refresh" />
					</q-toolbar>
				</q-card-section>
			</q-card>

			<q-card class="q-mt-lg">
				<q-card-section>
					<q-list>
						<q-item>
							<q-item-section>
								<q-item-label>Název</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-input v-if="localData" v-model="localData.name" />
								<q-skeleton v-else type="text" />
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Uživatelé</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-select
									v-if="localData"
									v-model="localData.users"
									:options="users"
									option-label="username"
									use-chips
									multiple
								/>
								<q-skeleton v-else type="QInput" />
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Skupiny panelů</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-select
									v-if="localData"
									v-model="localData.managedPanelGroups"
									:options="panelGroups"
									option-label="name"
									use-chips
									multiple
								/>
								<q-skeleton v-else type="QInput" />
							</q-item-section>
						</q-item>
					</q-list>
				</q-card-section>
			</q-card>

			<q-card class="q-mt-lg">
				<q-card-section>
					<q-markup-table flat>
						<thead>
							<tr>
								<th>Operace</th>
								<th>Plánovač</th>
								<th>Uživatelé</th>
								<th>Panely</th>
								<th>Soubory</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Čtení</td>
								<td
									class="text-center"
									v-bind:key="scope"
									v-for="scope in [
										Scope.ScheduleRead,
										Scope.UsersRead,
										Scope.PanelsRead,
										Scope.HostedRead,
									]"
								>
									<q-checkbox
										v-if="localData"
										:model-value="hasScope(localData, scope)"
										@update:model-value="toggleScope(localData, scope)"
									/>
									<template v-else>
										<q-skeleton type="QCheckbox" />
									</template>
								</td>
							</tr>
							<tr>
								<td>Zápis</td>
								<td
									class="text-center"
									v-bind:key="scope"
									v-for="scope in [
										Scope.ScheduleWrite,
										Scope.UsersWrite,
										Scope.PanelsWrite,
										Scope.HostedWrite,
									]"
								>
									<q-checkbox
										v-if="localData"
										:model-value="hasScope(localData, scope)"
										@update:model-value="toggleScope(localData, scope)"
									/>
									<template v-else>
										<q-skeleton type="QCheckbox" />
									</template>
								</td>
							</tr>
						</tbody>
					</q-markup-table>
				</q-card-section>
			</q-card>

			<q-page-sticky position="bottom-right" :offset="[18, 18]">
				<transition
					appear
					enter-active-class="animated bounceIn"
					leave-active-class="animated bounceOut"
				>
					<q-btn type="submit" v-if="isDirty" fab icon="save" color="primary" />
				</transition>
			</q-page-sticky>
		</q-form>
	</q-page>
</template>

<script setup lang="ts">
import { type Component, onBeforeMount, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import {
	Scope,
	type LinkedPanelGroup,
	type LinkedUser,
	type UserGroup,
} from '@vsb-eink/facade-api-client';

import { api, isNotFoundError } from '@/services/api';
import { redirectToNotFound } from '@/router/error-redirect';
import { useForm } from '@/composables/form';

const props = defineProps<{ id: number }>();
const route = useRoute();
const { notify } = useQuasar();

const { serverData, localData, isDirty, dirtyProps, validationErrorNotification } =
	useForm<UserGroup | null>(null);

const users = ref<LinkedUser[]>([]);
const panelGroups = ref<LinkedPanelGroup[]>([]);

const hasScope = (group: UserGroup, scope: Scope) => {
	return group.scopes.includes(scope);
};

const toggleScope = async (group: UserGroup, scope: Scope) => {
	if (!hasScope(group, scope)) {
		group.scopes.push(scope);
	} else {
		group.scopes = group.scopes.filter((s) => s !== scope);
	}
};

const pushData = async () => {
	if (!localData.value) return;
	try {
		serverData.value = await api.users
			.updateUserGroup(props.id, dirtyProps.value)
			.then((res) => res.data);
		notify({ message: 'Skupina byla úspěšně aktualizována', color: 'positive' });
	} catch (error) {
		notify({ message: 'Nepodařilo se aktualizovat skupinu', color: 'negative' });
	}
};

const pullData = async () => {
	try {
		serverData.value = await api.users.getUserGroup(props.id).then((res) => res.data);
	} catch (error) {
		if (isNotFoundError(error)) {
			notify({ message: 'Skupina nebyla nalezena', color: 'negative' });
			return redirectToNotFound(route);
		} else {
			notify({ message: 'Nepodařilo se načíst skupinu', color: 'negative' });
		}
	}

	try {
		[users.value, panelGroups.value] = await Promise.all([
			api.users.getUsers().then((res) =>
				res.data.map((user) => ({
					id: user.id,
					username: user.username,
				})),
			),
			api.panels
				.getPanelGroups()
				.then((res) =>
					res.data.map((panelGroup) => ({ id: panelGroup.id, name: panelGroup.name })),
				),
		]);
	} catch (error) {
		notify({
			message: 'Nepodařilo se načíst seznam uživatelů nebo skupin panelů',
			color: 'negative',
		});
	}
};

onBeforeMount(() => pullData());
onBeforeRouteUpdate(async (to, from, next) => {
	next(() => pullData());
});
</script>

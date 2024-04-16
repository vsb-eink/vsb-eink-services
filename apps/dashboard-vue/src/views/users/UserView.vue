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
							<span v-if="localUser">{{ localUser.username }}</span>
							<q-skeleton v-else></q-skeleton>
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
								<q-item-label>Username</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-input
									v-if="localUser"
									v-model="localUser.username"
									:rules="[isNotEmpty]"
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Heslo</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-input
									v-if="localUser"
									v-model="password"
									:disable="
										!(
											loggedInUser.hasScope(Scope.UsersWrite) ||
											localUser.id === loggedInUser.profile?.id
										)
									"
									type="password"
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Role</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-select
									v-if="localUser"
									v-model="localUser.role"
									:disable="!loggedInUser.isAdmin"
									:options="Object.values(Role)"
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Uživatelské skupiny</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-select
									v-if="localUser"
									v-model="localUser.groups"
									:options="groups"
									option-label="name"
									use-chips
									multiple
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>
					</q-list>
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
import { computed, onBeforeMount, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

import { type LinkableUserGroup, Role, Scope, type User } from '@vsb-eink/facade-api-client';

import { api, isNotFoundError } from '@/services/api';
import { redirectToNotFound } from '@/router/error-redirect';
import { useForm } from '@/composables/form';
import { isNotEmpty } from '@/utils/validators';
import { useUserStore } from '@/composables/user-store';

const props = defineProps<{ id: number }>();

const route = useRoute();
const { notify, dialog } = useQuasar();
const loggedInUser = useUserStore();

const {
	localData: localUser,
	serverData: serverUser,
	isDirty: isLocalUserDirty,
	dirtyProps,
	validationErrorNotification,
} = useForm<User | null>(null);
const password = ref('');
const isDirty = computed(() => isLocalUserDirty.value || password.value !== '');

const groups = ref<LinkableUserGroup[]>([]);

const pushData = async () => {
	if (!localUser.value) return;

	if (password.value) {
		const prompt = new Promise((resolve, reject) => {
			dialog({
				title: 'Změna hesla',
				message: `Opravdu si přejete změnit heslo uživatele ${localUser.value?.username}?`,
				cancel: true,
				persistent: true,
			})
				.onOk(() => resolve(true))
				.onCancel(() => resolve(false))
				.onDismiss(() => reject());
		});
		if (!(await prompt)) return;
	}

	try {
		serverUser.value = await api.users
			.updateUser(localUser.value.id, {
				...dirtyProps.value,
				password: password.value || undefined,
			})
			.then((res) => res.data);
		notify({ message: 'Uživatel byl úspěšně upraven', color: 'positive' });
	} catch (error) {
		notify({ message: 'Nepodařilo se upravit uživatele', color: 'negative' });
	}
};

const pullData = async () => {
	try {
		password.value = '';
		serverUser.value = await api.users.getUser(props.id).then((res) => res.data);
		groups.value = await api.users
			.getUserGroups()
			.then((res) => res.data.map((group) => ({ id: group.id, name: group.name })));
	} catch (error) {
		if (isNotFoundError(error)) {
			notify({ message: 'Uživatel nebyl nalezen', color: 'negative' });
			await redirectToNotFound(route);
		} else {
			notify({ message: 'Nepodařilo se načíst uživatele', color: 'negative' });
		}
	}
};

onBeforeMount(() => pullData());
onBeforeRouteUpdate(async (to, from, next) => {
	next(() => pullData());
});
</script>

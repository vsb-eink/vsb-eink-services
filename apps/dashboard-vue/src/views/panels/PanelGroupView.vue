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
								<q-item-label>Název</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-input
									v-if="localData"
									v-model="localData.name"
									:rules="[isNotEmpty]"
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Vlastníci skupiny</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-select
									v-if="localData"
									v-model="localData.managedBy"
									:options="userGroups"
									option-label="name"
									use-chips
									multiple
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Panely</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-select
									v-if="localData"
									v-model="localData.panels"
									:options="panels"
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
import { api, isForbiddenError, isNotFoundError } from '@/services/api';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { onBeforeMount, ref } from 'vue';
import type { LinkedPanel, LinkedUserGroup, PanelGroup } from '@vsb-eink/facade-api-client';
import { redirectToNotFound } from '@/router/error-redirect';
import { useQuasar } from 'quasar';
import { useForm } from '@/composables/form';
import { isNotEmpty } from '@/utils/validators';

const props = defineProps<{ id: string }>();
const route = useRoute();
const { notify } = useQuasar();

const { localData, serverData, isDirty, dirtyProps, validationErrorNotification } =
	useForm<PanelGroup | null>(null);

const panels = ref<LinkedPanel[]>([]);
const userGroups = ref<LinkedUserGroup[]>([]);

const pushData = async () => {
	if (!localData.value) return;
	try {
		serverData.value = await api.panels
			.updatePanelGroup(props.id, dirtyProps.value)
			.then((res) => res.data);
		notify({ message: 'Skupina byla úspěšně aktualizována', color: 'positive' });
	} catch (error) {
		notify({ message: 'Nepodařilo se aktualizovat skupinu', color: 'negative' });
	}
};

const pullData = async () => {
	try {
		serverData.value = await api.panels.getPanelGroup(props.id).then((res) => res.data);
	} catch (error) {
		if (isNotFoundError(error)) {
			notify({ message: 'Skupina nebyla nalezena', color: 'negative' });
			return redirectToNotFound(route);
		} else {
			notify({ message: 'Nepodařilo se načíst skupinu', color: 'negative' });
		}
	}

	try {
		panels.value = await api.panels
			.getPanels()
			.then((res) => res.data.map((panel) => ({ id: panel.id, name: panel.name })));
	} catch (error) {
		if (isForbiddenError(error)) {
			notify({
				message: 'Nemáte dostatečná oprávnění k načtení seznamu panelů',
				color: 'warning',
			});
		} else {
			notify({ message: 'Nepodařilo se načíst seznam panelů', color: 'negative' });
		}
	}

	try {
		userGroups.value = await api.users
			.getUserGroups()
			.then((res) => res.data.map((ug) => ({ id: ug.id, name: ug.name })));
	} catch (error) {
		if (isForbiddenError(error)) {
			notify({
				message: 'Nemáte dostatečná oprávnění k načtení seznamu uživatelských skupin',
				color: 'warning',
			});
		} else {
			notify({
				message: 'Nepodařilo se načíst seznam uživatelských skupin',
				color: 'negative',
			});
		}
	}
};

onBeforeMount(() => pullData());
onBeforeRouteUpdate(async (to, from, next) => {
	next(() => pullData());
});
</script>

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
								<q-item-label>Skupiny panelů</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-select
									v-if="localData"
									v-model="localData.groups"
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
import { type Component, onBeforeMount, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import type { LinkablePanelGroup, Panel } from '@vsb-eink/facade-api-client';

import { api, isNotFoundError } from '@/services/api';
import { redirectToNotFound } from '@/router/error-redirect';
import { useForm } from '@/composables/form';
import { isNotEmpty } from '@/utils/validators';

const props = defineProps<{ id: string }>();
const route = useRoute();
const { notify } = useQuasar();

const { localData, serverData, isDirty, dirtyProps, validationErrorNotification } =
	useForm<Panel | null>(null);

const groups = ref<LinkablePanelGroup[]>([]);

const pushData = async () => {
	if (!localData.value) return;
	try {
		serverData.value = await api.panels
			.updatePanel(localData.value.id, dirtyProps.value)
			.then((res) => res.data);
		notify({
			message: 'Panel byl úspěšně upraven',
			color: 'positive',
		});
	} catch (error) {
		notify({
			message: 'Nepodařilo se upravit panel',
			color: 'negative',
		});
	}
};

const pullData = async () => {
	try {
		serverData.value = await api.panels.getPanel(props.id).then((res) => res.data);
		groups.value = await api.panels
			.getPanelGroups()
			.then((res) => res.data.map((group) => ({ id: group.id, name: group.name })));
	} catch (error) {
		if (isNotFoundError(error)) {
			notify({
				message: 'Panel nebyl nalezen',
				color: 'negative',
			});
			return redirectToNotFound(route);
		} else {
			notify({
				message: 'Nepodařilo se načíst data',
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

<style scoped></style>

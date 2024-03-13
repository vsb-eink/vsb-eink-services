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
								<q-item-label>Popis</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-input v-if="localData" v-model="localData.description" />
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Cíl</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-select
									v-if="localData"
									v-model="localData.target"
									:options="targets"
									option-label="name"
									option-value="id"
									emit-value
									map-options
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Cron</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-input
									v-if="localData"
									v-model="localData.cron"
									:rules="[isNotEmpty, isValidCron]"
									:hint="cronForHumans"
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Aktivní</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-checkbox
									v-if="localData"
									v-model="localData.disabled"
									:true-value="false"
									:false-value="true"
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>

						<q-item>
							<q-item-section>
								<q-item-label>Priorita</q-item-label>
							</q-item-section>
							<q-item-section>
								<q-input
									v-if="localData"
									v-model="localData.priority"
									type="number"
									:rules="[isNotEmpty, isInteger]"
								/>
								<q-skeleton v-else></q-skeleton>
							</q-item-section>
						</q-item>
					</q-list>
				</q-card-section>
			</q-card>

			<q-card class="q-mt-lg">
				<q-card-section>
					<q-list>
						<q-item>
							<q-item-section>
								<q-item-label>
									<q-select
										v-if="localData"
										label="Příkaz"
										v-model="selectedCommand"
										:options="commands"
										:rules="[isNotEmpty]"
									/>
									<q-skeleton v-else></q-skeleton>
								</q-item-label>
							</q-item-section>
						</q-item>

						<template v-if="localData?.content && selectedCommand?.content">
							<q-item>
								<q-item-section>
									<q-item-label>Cyklit přes argumenty</q-item-label>
								</q-item-section>
								<q-item-section side>
									<q-checkbox v-if="localData" v-model="localData.shouldCycle" />
									<q-skeleton v-else type="QCheckbox" />
								</q-item-section>
							</q-item>

							<q-item :key="index" v-for="(item, index) in localData.content">
								<q-item-section>
									<q-input
										v-model="localData.content[index]"
										:label="selectedCommand.content.label"
										:rules="selectedCommand.content.rules"
									>
										<template v-slot:append>
											<q-btn
												flat
												icon="delete"
												@click="removeArgument(index)"
											></q-btn>
										</template>
									</q-input>
								</q-item-section>
							</q-item>

							<q-item v-if="localData?.content">
								<q-item-section>
									<q-btn flat icon="add" @click="addArgument" />
								</q-item-section>
							</q-item>
						</template>
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
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import cronstrue from 'cronstrue';
import 'cronstrue/locales/cs';

import type { LinkedPanel, LinkedPanelGroup, ScheduledJob } from '@vsb-eink/facade-api-client';

import { api, isForbiddenError, isNotFoundError } from '@/services/api';
import { redirectToNotFound } from '@/router/error-redirect';
import { useForm } from '@/composables/form';
import { syncRef } from '@vueuse/core';
import { isInteger, isNotEmpty, isValidCron, isValidUrl } from '@/utils/validators';

const props = defineProps<{
	id: number;
}>();
const router = useRouter();
const route = useRoute();
const { notify } = useQuasar();

const { localData, serverData, isDirty, dirtyProps, validationErrorNotification } =
	useForm<ScheduledJob | null>(null);

const targets = ref<(LinkedPanel | LinkedPanelGroup)[]>([]);

const commands: CommandOption[] = [
	{
		label: 'Zobrazit (částečný překres)',
		value: 'display/url_1bpp/set',
		content: {
			label: 'URL',
			rules: [isNotEmpty, isValidUrl],
		},
	},
	{
		label: 'Zobrazit (plný překres)',
		value: 'display/url_4bpp/set',
		content: {
			label: 'URL',
			rules: [isNotEmpty, isValidUrl],
		},
	},
];

const selectedCommand = ref<CommandOption | null>(null);

const cronForHumans = computed(() => {
	if (!localData.value) return '';
	try {
		return cronstrue.toString(localData.value.cron, { locale: 'cs' });
	} catch (error) {
		return '';
	}
});

syncRef(localData, selectedCommand, {
	transform: {
		ltr: (local) => {
			if (!local) return null;
			const command = commands.find((c) => c.value === local.command);
			if (!command) return null;
			return command;
		},
		rtl: (selected) => {
			if (!localData.value) return null;
			if (!selected) return null;
			return {
				...localData.value,
				command: selected.value,
			};
		},
	},
});

const removeArgument = (index: number) => {
	if (!localData.value) return;
	localData.value.content.splice(index, 1);
};

const addArgument = () => {
	if (!localData.value) return;
	localData.value.content.push('');
};

const getDefaults = (): ScheduledJob => ({
	id: -1,
	name: '',
	description: '',
	target: '',
	cron: '',
	command: '',
	content: [],
	precise: false,
	cycle: 0,
	priority: 0,
	disabled: false,
	shouldCycle: false,
});

const pushData = async () => {
	if (!localData.value) return;

	try {
		// if the command is contentless, content should be removed from the job
		if (dirtyProps.value.command && !selectedCommand.value?.content) {
			dirtyProps.value.content = [];
		}

		if (localData.value.id < 0) {
			serverData.value = await api.schedule
				.createScheduledJob({
					name: localData.value.name,
					description: localData.value.description,
					target: localData.value.target,
					cron: localData.value.cron,
					command: localData.value.command,
					content: localData.value.content,
					priority: localData.value.priority,
					shouldCycle: localData.value.shouldCycle,
				})
				.then((res) => res.data);
			await router.push({
				name: 'schedule-detail',
				params: { id: serverData.value!.id },
				replace: true,
			});
		} else {
			serverData.value = await api.schedule
				.updateScheduledJob(localData.value.id, dirtyProps.value)
				.then((res) => res.data);
		}

		notify({
			message: 'Data byla uložena',
			color: 'positive',
		});
	} catch (error) {
		notify({
			message: 'Nepodařilo se uložit data',
			color: 'negative',
		});
	}
};

const pullData = async () => {
	try {
		if (props.id === -1) {
			serverData.value = getDefaults();
		} else {
			serverData.value = await api.schedule.getScheduledJob(props.id).then((res) => res.data);
		}
	} catch (error) {
		if (isNotFoundError(error)) {
			notify({
				message: 'Naplánovaná úloha nebyla nalezena',
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

	try {
		const panelGroups = await api.panels
			.getPanelGroups()
			.then((res) => res.data.map((g) => ({ id: g.id, name: g.name })));
		const panels = await api.panels
			.getPanels()
			.then((res) => res.data.map((p) => ({ id: p.id, name: p.name })));
		targets.value = [...panelGroups, ...panels];
	} catch (error) {
		if (isForbiddenError(error)) {
			notify({
				message: 'Nemáte oprávnění načíst seznam cílů',
				color: 'negative',
			});
		} else {
			notify({
				message: 'Nepodařilo se načíst seznam cílů',
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

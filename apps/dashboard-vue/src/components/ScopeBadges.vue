<template>
	<q-btn disable flat v-bind:key="chip.label" v-for="chip in chips" round :icon="chip.icon">
		<q-badge floating>{{ chip.permissions }}</q-badge>
	</q-btn>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Scope } from '@/types/scopes';

const props = defineProps<{
	scopes: Scope[];
}>();

const chips = computed(() => {
	const cache = new Map<string, { icon: string; label: string; permissions: string }>();
	for (const scope of [...props.scopes].sort()) {
		const [name, permission] = scope.toLowerCase().split('_');

		let icon = '';
		switch (name) {
			case 'hosted':
				icon = 'perm_media';
				break;
			case 'users':
				icon = 'person';
				break;
			case 'panels':
				icon = 'connected_tv';
				break;
			case 'groups':
				icon = 'group';
				break;
			case 'schedule':
				icon = 'schedule';
				break;
			default:
				icon = 'error';
		}

		const permissionChar = permission.charAt(0);

		const entry = cache.get(name);
		if (!entry) {
			cache.set(name, { icon, label: name, permissions: permissionChar });
		} else if (!entry.permissions.includes(permissionChar)) {
			entry.permissions += permissionChar;
		}
	}

	return Array.from(cache.values());
});
</script>

<style scoped></style>

<template>
	<router-view />
</template>

<script setup lang="ts">
import { router } from '@/router';
import { useMeta } from 'quasar';
import { useUserStore } from '@/composables/user-store';

const user = useUserStore();
user.fetchProfile();

useMeta(() => ({
	title: `${router.currentRoute.value.meta.title?.toString()} - VŠB EInk`,
}));
</script>

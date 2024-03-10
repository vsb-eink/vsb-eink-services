<template>
	<div class="q-table__grid-item col-xs-12 col-sm-6 col-md-4 col-lg-3">
		<div class="q-table__grid-item-card q-table__card q-table--flat">
			<div
				v-bind:key="col.name"
				v-for="col in props.props.cols"
				class="q-table__grid-item-row"
			>
				<div class="q-table__grid-item-title">{{ col.label }}</div>
				<div class="q-table__grid-item-value" :style="col.style" :class="col.classes">
					{{ col.value }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { QTableSlots } from 'quasar';

const props = defineProps<{
	props: Parameters<QTableSlots['item']>[0];
}>();
</script>

<style scoped></style>

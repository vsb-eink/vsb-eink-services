<!--
<q-icon :name="prop.node.type === 'directory' ? 'folder' : 'insert_drive_file'" />
<span style="width: 1ex" />
<span>{{ prop.node.name }}</span>
-->

<template>
	<q-page padding>
		<q-card>
			<q-card-section>
				<div class="text-h5">Soubory</div>
			</q-card-section>

			<q-card-section>
				<q-tree
					:nodes="files"
					v-model:selected="selected"
					node-key="path"
					label-key="name"
					selected-color="primary"
				>
					<template v-slot:default-header="prop">
						<q-toolbar class="text-caption">
							<q-icon
								:name="
									prop.node.type === 'directory' ? 'folder' : 'insert_drive_file'
								"
							/>
							<span class="q-ml-sm">{{ prop.node.name }}</span>
							<q-space />
							<q-btn flat rounded dense icon="delete" />
							<q-btn flat rounded dense icon="more_vert" />
						</q-toolbar>
					</template>
				</q-tree>
			</q-card-section>
		</q-card>
	</q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { http } from '@/services/http';

const files = ref([]);
const selected = ref(null);

onMounted(async () => {
	try {
		const res = await http.get('/hosted/core/files');
		files.value = res.data.children;
	} catch (error) {
		console.error(error);
	}
});
</script>

<style scoped></style>

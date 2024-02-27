<template>
	<q-page padding>
		<q-card>
			<q-card-section class="q-pa-none">
				<q-toolbar>
					<q-toolbar-title>Hostované soubory</q-toolbar-title>
					<q-space />
					<q-btn
						flat
						round
						dense
						@click="refresh()"
						icon="refresh"
						title="Aktualizovat"
					/>
					<q-btn flat rounded dense icon="more_vert">
						<q-menu>
							<q-list>
								<q-item clickable @click="uploadFile({ path: '' })">
									Nahrát sem
								</q-item>
								<q-item clickable @click="newFolder({ name: '', path: '' })">
									Nová složka
								</q-item>
							</q-list>
						</q-menu>
					</q-btn>
				</q-toolbar>
			</q-card-section>

			<q-card-section>
				<q-tree :nodes="files" node-key="path" label-key="name">
					<template v-slot:default-header="prop">
						<q-toolbar class="text-caption" @click.stop @keypress.stop>
							<q-icon
								:name="
									prop.node.type === 'directory' ? 'folder' : 'insert_drive_file'
								"
							/>
							<span class="q-ml-sm">{{ prop.node.name }}</span>
							<q-space />
							<q-btn flat rounded dense icon="more_vert">
								<q-menu>
									<q-list>
										<template v-if="prop.node.type === 'directory'">
											<q-item
												v-if="prop.node.type === 'directory'"
												clickable
												@click="uploadFile(prop.node)"
											>
												Nahrát sem
											</q-item>
											<q-item clickable @click="newFolder(prop.node)">
												Nová složka
											</q-item>
										</template>
										<q-item clickable @click="renameFile(prop.node)">
											Přejmenovat
										</q-item>
										<q-item clickable @click="openFile(prop.node)">
											Otevřít
										</q-item>
										<q-item clickable @click="deleteFile(prop.node)">
											Smazat
										</q-item>
										<q-item clickable @click="copyUrl(prop.node)">
											Zkopírovat cestu
										</q-item>
									</q-list>
								</q-menu>
							</q-btn>
						</q-toolbar>
					</template>
				</q-tree>
			</q-card-section>
		</q-card>
	</q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { http } from '@/services/http';
import { FACADE_URL } from '@/environment';
import { useClipboard, useFileDialog } from '@vueuse/core';

const { dialog } = useQuasar();
const files = ref([]);

const clipboard = useClipboard();
const uploadDialog = useFileDialog();

const refresh = async () => {
	try {
		const res = await http.get('/hosted/core/files');
		files.value = res.data.children;
	} catch (error) {
		console.error(error);
	}
};

onMounted(async () => {
	try {
		await refresh();
	} catch (error) {
		console.error(error);
	}
});

const deleteFile = (file) => {
	dialog({
		title: 'Smazat soubor',
		message: `Opravdu chcete smazat soubor ${file.path}?`,
		cancel: true,
	}).onOk(async () => {
		await http.delete(`/hosted/core/files/${file.path}`);
		await refresh();
	});
};

const newFolder = (dir) => {
	dialog({
		title: 'Nová složka',
		prompt: {
			model: '',
			type: 'text',
			autofocus: true,
		},
		cancel: true,
	}).onOk(async (name) => {
		const newPath = dir.path ? `${dir.path}/${name}` : name;
		await http.post(`/hosted/core/files/${newPath}`);
		await refresh();
	});
};

const renameFile = (file) => {
	dialog({
		title: 'Přejmenovat soubor',
		prompt: {
			model: file.name,
			type: 'text',
			autofocus: true,
		},
		cancel: true,
	}).onOk(async (name) => {
		await http.patch(`/hosted/core/files/${file.path}`, { name });
		await refresh();
	});
};

const openFile = (file) => {
	window.open(`${FACADE_URL}hosted/user/${file.path}`);
};

const copyUrl = (file) => {
	clipboard.copy(`${FACADE_URL}hosted/user/${file.path}`);
};

const uploadFile = (dir) => {
	uploadDialog.reset();
	uploadDialog.open({
		multiple: true,
	});

	uploadDialog.onChange(async (files) => {
		await http.post(`/hosted/core/files/${dir.path}`, files);
		await refresh();
	});
};
</script>

<style scoped></style>

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
								<q-item clickable @click="createFolder('')">Nová složka</q-item>
							</q-list>
						</q-menu>
					</q-btn>
				</q-toolbar>
			</q-card-section>

			<q-card-section>
				<q-linear-progress v-if="loading" indeterminate color="black" />
				<q-tree v-else dense :nodes="files" node-key="path" label-key="name">
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
												@click="uploadFile(prop.node.path)"
											>
												Nahrát sem
											</q-item>
											<q-item clickable @click="createFolder(prop.node.path)">
												Nová složka
											</q-item>
										</template>
										<q-item clickable @click="renameContent(prop.node)">
											Přejmenovat
										</q-item>
										<q-item clickable @click="openFile(prop.node)">
											Otevřít
										</q-item>
										<q-item clickable @click="deleteContent(prop.node)">
											Smazat
										</q-item>
										<q-item clickable @click="copyUrl(prop.node)">
											Zkopírovat URL
										</q-item>
									</q-list>
								</q-menu>
							</q-btn>
						</q-toolbar>
					</template>
				</q-tree>
			</q-card-section>
		</q-card>

		<q-page-sticky position="bottom-right" :offset="[18, 18]">
			<q-btn @click="uploadFile('')" fab icon="add" color="primary" />
		</q-page-sticky>
	</q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '@/services/api';
import { FACADE_URL } from '@/environment';
import { useClipboard, useFileDialog } from '@vueuse/core';
import type { ContentMetadata, FileMetadata } from '@vsb-eink/facade-api-client';

const { dialog, notify } = useQuasar();
const files = ref<ContentMetadata[]>([]);
const loading = ref(true);

const clipboard = useClipboard();
const uploadDialog = useFileDialog();

const refresh = async () => {
	try {
		loading.value = true;
		const res = await api.hosted.getContentMetadata('/');
		if (res.data.type !== 'directory') {
			notify({ message: 'Nelze zobrazit obsah kořenové složky', color: 'negative' });
			return;
		}
		files.value = res.data.children;
	} catch (error) {
		console.error(error);
	} finally {
		loading.value = false;
	}
};

onMounted(async () => {
	try {
		await refresh();
	} catch (error) {
		console.error(error);
	}
});

const deleteContent = (content: ContentMetadata) => {
	dialog({
		title: 'Smazat soubor',
		message: `Opravdu chcete smazat soubor ${content.path}?`,
		cancel: true,
	}).onOk(async () => {
		await api.hosted.deleteContent(content.path);
		await refresh();
	});
};

const createFolder = (path: string) => {
	dialog({
		title: 'Nová složka',
		prompt: {
			model: '',
			type: 'text',
			autofocus: true,
		},
		cancel: true,
	}).onOk(async (name) => {
		if (!name) {
			notify({ message: 'Název složky nesmí být prázdný', color: 'negative' });
			return;
		}
		const newPath = `${path}/${name}`;
		await api.hosted.uploadContent(newPath, []);
		await refresh();
	});
};

const renameContent = (content: ContentMetadata) => {
	dialog({
		title: 'Přejmenovat položku',
		prompt: {
			model: content.name,
			type: 'text',
			autofocus: true,
		},
		cancel: true,
	}).onOk(async (name: string) => {
		await api.hosted.renameContent(content.path, { name });
		await refresh();
	});
};

const openFile = (file: FileMetadata) => {
	window.open(`${FACADE_URL}hosted/user/${file.path}`);
};

const copyUrl = (content: ContentMetadata) => {
	clipboard.copy(`${FACADE_URL}hosted/user/${content.path}`);
};

const uploadFile = (path: string) => {
	uploadDialog.reset();
	uploadDialog.open({
		multiple: true,
	});

	uploadDialog.onChange(async (files) => {
		if (!files) return;
		await api.hosted.uploadContent(path, [...files]);
		await refresh();
	});
};
</script>

<style scoped></style>

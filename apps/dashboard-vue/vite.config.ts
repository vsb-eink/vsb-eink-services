import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import importMetaEnv from '@import-meta-env/unplugin';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue({
			template: { transformAssetUrls },
		}),
		quasar({
			sassVariables: 'src/assets/quasar-variables.sass',
		}),
		importMetaEnv.vite({
			example: '.env.example'
		})
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
});

/// <reference types="vite/client" />
interface ImportMetaEnv {
	readonly FACADE_URL: string;
}

interface ImportMeta {
	env: ImportMetaEnv;
}

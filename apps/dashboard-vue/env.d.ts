/// <reference types="vite/client" />
interface ImportMetaEnv {
	readonly VITE_FACADE_URL: string;
}

interface ImportMeta {
	env: ImportMetaEnv;
}

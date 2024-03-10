import { from } from 'env-var';

const env = from({
	FACADE_URL: import.meta.env.VITE_FACADE_URL,
});

export const FACADE_URL = env.get('FACADE_URL').required().asUrlString();

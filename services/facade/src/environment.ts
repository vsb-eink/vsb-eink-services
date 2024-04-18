import { default as env } from 'env-var';

export const API_HOST = env.get('API_HOST').default('0.0.0.0').asString();
export const API_PORT = env.get('API_PORT').default(3000).asPortNumber();

export const LOG_LEVEL = env
	.get('LOG_LEVEL')
	.default('info')
	.asEnum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']);

export const DEFAULT_ADMIN_PASSWORD = env.get('DEFAULT_ADMIN_PASSWORD').required().asString();
export const JWT_SECRET = env.get('JWT_SECRET').required().asString();

export const DATABASE_URL = env.get('DATABASE_URL').required().asUrlString();
export const GROUPER_URL = env.get('GROUPER_URL').required().asUrlString();
export const HOSTER_URL = env.get('HOSTER_URL').required().asUrlString();
export const SCHEDULER_URL = env.get('SCHEDULER_URL').required().asUrlString();

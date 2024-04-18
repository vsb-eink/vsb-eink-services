import env from 'env-var';

export const USER_CONTENT_PATH = env.get('USER_CONTENT_PATH').default('public').asString();

export const API_HOST = env.get('API_HOST').default('0.0.0.0').asString();
export const API_PORT = env.get('API_PORT').default(3000).asPortNumber();

export const LOG_LEVEL = env
	.get('LOG_LEVEL')
	.default('info')
	.asEnum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']);

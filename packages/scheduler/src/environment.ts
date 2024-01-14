import { default as env } from 'env-var';

export const MQTT_URL = env
	.get('BROKER_HOST')
	.default('localhost')
	.asString();

export const HOST = env.get('API_HOST').default('127.0.0.1').asString();
export const PORT = env.get('API_PORT').default(3000).asPortNumber();

export const CRONTAB_PATH = env
	.get('CRONTAB_PATH')
	.default('eink.cron')
	.asString();

export const CONTENT_PATH = env
	.get('CONTENT_PATH')
	.default(process.cwd())
	.asString();

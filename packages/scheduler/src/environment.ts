import { default as env } from 'env-var';

export const MQTT_HOST = env.get('MQTT_HOST').default('localhost').asString();
export const MQTT_PORT = env.get('MQTT_PORT').default(1883).asPortNumber();
export const MQTT_URL = env.get('MQTT_URL').default(`mqtt://${MQTT_HOST}:${MQTT_PORT}`).asString();

export const API_HOST = env.get('API_HOST').default('127.0.0.1').asString();
export const API_PORT = env.get('API_PORT').default(3000).asPortNumber();

export const CRONTAB_PATH = env.get('CRONTAB_PATH').default('eink.cron').asString();

export const CONTENT_PATH = env.get('CONTENT_PATH').default(process.cwd()).asString();

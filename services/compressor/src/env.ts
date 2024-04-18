import env from 'env-var';

export const MQTT_HOST = env.get('MQTT_HOST').default('localhost').asString();
export const MQTT_PORT = env.get('MQTT_PORT').default(1883).asPortNumber();
export const MQTT_URL = env.get('MQTT_URL').default(`mqtt://${MQTT_HOST}:${MQTT_PORT}`).asString();

export const LOG_LEVEL = env
	.get('LOG_LEVEL')
	.default('info')
	.asEnum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']);

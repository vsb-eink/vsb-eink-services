#!/usr/bin/env node

import sharp from 'sharp';
import { connectAsync } from 'mqtt';
import { MQTT_HOST, MQTT_PORT } from './env.js';
import {
	isSupportedExtension,
	isSupportedMode,
	SUPPORTED_EXTENSIONS,
	SUPPORTED_MODES,
	toRawInkplate10Buffer,
} from './graphics/compress.js';

console.log(`Connecting to MQTT broker at ${MQTT_HOST}:${MQTT_PORT}`);
const mqtt = await connectAsync(`mqtt://${MQTT_HOST}:${MQTT_PORT}`);
console.log(`Connected to MQTT broker at ${MQTT_HOST}:${MQTT_PORT}`);

for (const extension of SUPPORTED_EXTENSIONS) {
	for (const mode of SUPPORTED_MODES) {
		const topic = `vsb-eink/+/display/${extension}_${mode}/set`;

		console.log(`Subscribing to ${topic}`);
		await mqtt.subscribeAsync(topic);
	}
}

mqtt.on('message', async (topic, payload) => {
	console.log(`Received message on ${topic}`);

	const [, target, command, format, ...rest] = topic.split('/');
	const image = sharp(payload);

	const [extension, mode] = format.split('_');

	if (!isSupportedExtension(extension)) {
		console.error(`Unsupported extension: ${extension}`);
		return;
	}

	if (!isSupportedMode(mode)) {
		console.error(`Unsupported mode: ${mode}`);
		return;
	}

	const compressed = await toRawInkplate10Buffer(image, mode);

	await mqtt.publishAsync(
		`vsb-eink/${target}/display/raw_${mode}/set`,
		compressed,
	);
	console.log(
		`Published message on vsb-eink/${target}/display/raw_${mode}/set`,
	);
});

#!/usr/bin/env node

import 'dotenv/config';
import sharp from 'sharp';
import { connectAsync } from 'mqtt';

import { MQTT_URL } from './env.js';
import {
	isSupportedMimeType,
	isSupportedMode,
	SUPPORTED_EXTENSIONS,
	SUPPORTED_MODES,
	toRawInkplate10Buffer,
} from './graphics/compress.js';
import { fetchBuffer, fetchMimeType } from './utils/http.js';

console.log(`Connecting to MQTT broker at ${MQTT_URL}`);
const mqtt = await connectAsync(MQTT_URL);
console.log(`Connected to MQTT broker at ${MQTT_URL}`);

// image types
for (const type of SUPPORTED_EXTENSIONS) {
	for (const mode of SUPPORTED_MODES) {
		const topic = `vsb-eink/+/display/${type}_${mode}/set`;

		console.log(`Subscribing to ${topic}`);
		await mqtt.subscribeAsync(topic);
	}
}

// remote urls
for (const mode of SUPPORTED_MODES) {
	const topic = `vsb-eink/+/display/url_${mode}/set`;

	console.log(`Subscribing to ${topic}`);
	await mqtt.subscribeAsync(topic);
}

// incoming messages
mqtt.on('message', async (topic, payload) => {
	console.log(`Received message on ${topic}`);

	if (payload.length === 0) {
		console.error('Payload is empty, skipping');
		return;
	}

	const [, target, command, format, ...rest] = topic.split('/');
	const [extension, mode] = format.split('_');

	try {
		const mimeType =
			extension === 'url'
				? await fetchMimeType(payload.toString('utf8'))
				: `image/${extension}`;

		if (!isSupportedMimeType(mimeType)) {
			return;
		}

		if (!isSupportedMode(mode)) {
			console.error(`Unsupported mode: ${mode}`);
			return;
		}

		const image = sharp(extension === 'url' ? await fetchBuffer(payload.toString()) : payload);
		const compressed = await toRawInkplate10Buffer(image, mode);

		console.log(`Compressed image to ${compressed.length} bytes`);

		await mqtt.publishAsync(`vsb-eink/${target}/display/raw_${mode}/set`, compressed);
		console.log(`Published message on vsb-eink/${target}/display/raw_${mode}/set`);
	} catch (error) {
		console.error(`Failed to compress image: ${error}`);
		console.trace(error);
	}
});

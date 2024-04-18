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
import { logger } from './logger.js';

logger.info(`Connecting to MQTT broker at ${MQTT_URL}`);
const mqtt = await connectAsync(MQTT_URL);
logger.info(`Connected to MQTT broker at ${MQTT_URL}`);

// image types
for (const type of SUPPORTED_EXTENSIONS) {
	for (const mode of SUPPORTED_MODES) {
		const topic = `vsb-eink/+/display/${type}_${mode}/set`;

		logger.info(`Subscribing to ${topic}`);
		await mqtt.subscribeAsync(topic);
	}
}

// remote urls
for (const mode of SUPPORTED_MODES) {
	const topic = `vsb-eink/+/display/url_${mode}/set`;

	logger.info(`Subscribing to ${topic}`);
	await mqtt.subscribeAsync(topic);
}

// incoming messages
mqtt.on('message', async (topic, payload) => {
	logger.info(`Received message on ${topic}`);

	if (payload.length === 0) {
		logger.error('Payload is empty, skipping');
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
			logger.error(`Unsupported mode: ${mode}`);
			return;
		}

		const image = sharp(extension === 'url' ? await fetchBuffer(payload.toString()) : payload);
		const compressed = await toRawInkplate10Buffer(image, mode);

		logger.info(`Compressed image to ${compressed.length} bytes`);

		await mqtt.publishAsync(`vsb-eink/${target}/display/raw_${mode}/set`, compressed);
		logger.info(`Published message on vsb-eink/${target}/display/raw_${mode}/set`);
	} catch (error) {
		logger.error(`Failed to compress image: ${error}`);
		logger.trace(error);
	}
});

import { MqttClient } from 'mqtt';
import { matches as topicMatches } from 'mqtt-pattern';

import { logger } from './logger.js';

export class MQTTJSMessageBrokerWrapper implements AbstractMessageBroker {
	private handlers = new Map<string, (topic: string, message: Buffer) => Promise<void>>();
	private client: MqttClient;

	constructor(client: MqttClient) {
		this.client = client;
		this.client.on('message', (topic, message) => {
			for (const [pattern, handler] of this.handlers.entries()) {
				if (topicMatches(pattern, topic)) {
					logger.info(`Received message on ${topic}`);
					handler(topic, message).catch((error) => {
						logger.error(`Failed to handle message: ${error}`);
					});
				}
			}
		});
	}

	async publish(topic: string, message: string | Buffer): Promise<void> {
		logger.info(`Publishing to ${topic}...`);
		await this.client.publishAsync(topic, message);
	}

	async subscribe(topic: string): Promise<void> {
		logger.info(`Subscribing to ${topic}...`);
		await this.client.subscribeAsync(topic);
	}

	async setHandler(
		topic: string,
		handler: (topic: string, message: Buffer) => Promise<void>,
	): Promise<void> {
		this.handlers.set(topic, handler);
	}
}

export interface AbstractMessageBroker {
	publish(topic: string, message: string | Buffer): Promise<void>;
	subscribe(topic: string): Promise<void>;
	setHandler(
		topic: string,
		handler: (topic: string, message: Buffer) => Promise<void>,
	): Promise<void>;
}

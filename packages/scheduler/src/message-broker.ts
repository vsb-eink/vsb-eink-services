export interface AbstractMessageBroker {
	publish(topic: string, message: string | Buffer): Promise<void>;
	subscribe(topic: string): Promise<void>;
	setHandler(topic: string, handler: (topic: string, message: Buffer) => Promise<void>): Promise<void>;
}

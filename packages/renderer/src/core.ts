import { rm } from 'node:fs/promises';
import { join as joinPath } from 'node:path';

import { Browser, BrowserContext } from 'playwright';

import { AbstractMessageBroker } from './message-broker.js';
import { InternalHTTPServer } from './internal-http/index.js';
import { logger } from './logger.js';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';

class EInkRendererCore {
	private broker: AbstractMessageBroker;
	private browser: Browser;
	private internalHTTPServer;
	private internalHTTPServerAddress: string | null = null;

	constructor({
		broker,
		browser,
		internalHTTPServer,
	}: {
		broker: AbstractMessageBroker;
		browser: Browser;
		internalHTTPServer: InternalHTTPServer;
	}) {
		this.broker = broker;
		this.browser = browser;
		this.internalHTTPServer = internalHTTPServer;
	}

	async run() {
		try {
			this.internalHTTPServerAddress = await this.internalHTTPServer.server.listen({
				port: this.internalHTTPServer.options.port,
				host: this.internalHTTPServer.options.host,
			});
			logger.info(`Internal HTTP server listening at ${this.internalHTTPServerAddress}`);
		} catch (err) {
			logger.error(`Internal HTTP server failed to start: ${err}`);
			return;
		}

		try {
			await this.broker.subscribe(`vsb-eink/+/display/html_1bpp/set`);
			await this.broker.setHandler(`vsb-eink/+/display/html_1bpp/set`, this.handleDisplayHtml.bind(this));

			await this.broker.subscribe(`vsb-eink/+/display/html_4bpp/set`);
			await this.broker.setHandler(`vsb-eink/+/display/html_4bpp/set`, this.handleDisplayHtml.bind(this));
		} catch (err) {
			logger.error(`Failed to subscribe to MQTT topics: ${err}`);
			return;
		}

		// keep the process running
		while (true) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	private async handleDisplayHtml(topic: string, message: Buffer) {
		const [, target, command, action, ...rest] = topic.split('/');
		const html = message.toString('utf-8');
		const [type, mode] = action.split('_');

		const uuid = randomUUID();
		const htmlDir = joinPath(this.internalHTTPServer.options.root, 'workdir', uuid);

		let context: BrowserContext | null = null;
		try {
			await mkdir(htmlDir, { recursive: true });
			await writeFile(joinPath(htmlDir, 'index.html'), html);
			logger.info(`Saved HTML to ${joinPath(htmlDir, 'index.html')}`);

			context = await this.browser.newContext({});
			context.on('console', (msg) =>
				logger.info(`Browser console: ${msg.text()}`),
			);

			const page = await context.newPage();
			await page.setViewportSize({ width: 1200, height: 825 });
			await page.goto(`${this.internalHTTPServerAddress}/workdir/${uuid}`, { waitUntil: 'networkidle' });

			const screenshot = await page.screenshot({
				type: 'png',
				animations: 'disabled',
				scale: 'css',
			});

			await this.broker.publish(
				`vsb-eink/${target}/display/png_${mode}/set`,
				screenshot,
			);
		} catch (err) {
			logger.error(`Failed to render HTML: ${err}`);
		} finally {
			await context?.close();
			await rm(htmlDir, { recursive: true, force: true });
			logger.info(`Cleaned up ${htmlDir}`);
		}
	}
}

export { EInkRendererCore };

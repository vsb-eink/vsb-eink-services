import { rm , mkdir, writeFile } from 'node:fs/promises';
import { join as joinPath } from 'node:path';

import { Browser, BrowserContext } from 'playwright';

import { AbstractMessageBroker } from './message-broker.js';
import { InternalHTTPServer } from './internal-http/index.js';
import { logger } from './logger.js';
import { randomUUID } from 'node:crypto';


class EInkRendererCore {
	private broker: AbstractMessageBroker;
	private browser: Browser;

	constructor({
		broker,
		browser
	}: {
		broker: AbstractMessageBroker;
		browser: Browser;
	}) {
		this.broker = broker;
		this.browser = browser;
	}

	async run() {
		try {
			await this.broker.subscribe(`vsb-eink/+/display/html_1bpp/set`);
			await this.broker.setHandler(`vsb-eink/+/display/html_1bpp/set`, this.handleDisplayHtml.bind(this));

			await this.broker.subscribe(`vsb-eink/+/display/html_4bpp/set`);
			await this.broker.setHandler(`vsb-eink/+/display/html_4bpp/set`, this.handleDisplayHtml.bind(this));

			await this.broker.subscribe(`vsb-eink/+/display/url_1bpp/set`);
			await this.broker.setHandler(`vsb-eink/+/display/url_1bpp/set`, this.handleDisplayHtml.bind(this));

			await this.broker.subscribe(`vsb-eink/+/display/url_4bpp/set`);
			await this.broker.setHandler(`vsb-eink/+/display/url_4bpp/set`, this.handleDisplayHtml.bind(this));
		} catch (error) {
			logger.error(`Failed to subscribe to MQTT topics: ${error}`);
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
			context.on('console', (message_) =>
				logger.info(`Browser console: ${message_.text()}`),
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
		} catch (error) {
			logger.error(`Failed to render HTML: ${error}`);
		} finally {
			await context?.close();
			await rm(htmlDir, { recursive: true, force: true });
			logger.info(`Cleaned up ${htmlDir}`);
		}
	}
}

export { EInkRendererCore };

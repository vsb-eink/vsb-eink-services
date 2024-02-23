import { Browser, BrowserContext } from 'playwright';

import { AbstractMessageBroker } from './message-broker.js';
import { logger } from './logger.js';
import { fetchMimeType } from './utils/http.js';

class EInkRendererCore {
	private broker: AbstractMessageBroker;
	private browser: Browser;

	constructor({ broker, browser }: { broker: AbstractMessageBroker; browser: Browser }) {
		this.broker = broker;
		this.browser = browser;
	}

	async run() {
		try {
			await this.broker.subscribe(`vsb-eink/+/display/html_1bpp/set`);
			await this.broker.setHandler(
				`vsb-eink/+/display/html_1bpp/set`,
				this.handleDisplayHtml.bind(this),
			);

			await this.broker.subscribe(`vsb-eink/+/display/html_4bpp/set`);
			await this.broker.setHandler(
				`vsb-eink/+/display/html_4bpp/set`,
				this.handleDisplayHtml.bind(this),
			);

			await this.broker.subscribe(`vsb-eink/+/display/url_1bpp/set`);
			await this.broker.setHandler(
				`vsb-eink/+/display/url_1bpp/set`,
				this.handleDisplayHtml.bind(this),
			);

			await this.broker.subscribe(`vsb-eink/+/display/url_4bpp/set`);
			await this.broker.setHandler(
				`vsb-eink/+/display/url_4bpp/set`,
				this.handleDisplayHtml.bind(this),
			);
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
		if (message.length === 0) {
			logger.error('Payload is empty, skipping');
			return;
		}

		const [, target, _command, action, ..._rest] = topic.split('/');
		const html = message.toString('utf8');
		const [type, mode] = action.split('_');

		let context: BrowserContext | undefined;
		try {
			const contentUrl =
				type === 'url'
					? message.toString('utf8')
					: `data:text/html;base64,${message.toString('base64')}`;

			// render only html content
			if (type === 'url' && contentUrl.startsWith('http')) {
				const mimeType = await fetchMimeType(html);

				if (!mimeType.startsWith('text/html')) {
					return;
				}
			}

			context = await this.browser.newContext({});
			context.on('console', (message_) => logger.info(`Browser console: ${message_.text()}`));

			const page = await context.newPage();
			await page.setViewportSize({ width: 1200, height: 825 });
			await page.goto(contentUrl, { waitUntil: 'networkidle' });

			const screenshot = await page.screenshot({
				type: 'png',
				animations: 'disabled',
				scale: 'css',
			});

			await this.broker.publish(`vsb-eink/${target}/display/png_${mode}/set`, screenshot);
		} catch (error) {
			logger.error(`Failed to render HTML: ${error}`);
		} finally {
			await context?.close();
		}
	}
}

export { EInkRendererCore };

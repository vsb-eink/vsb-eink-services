#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers'
import { chromium } from 'playwright';
import { parse as parseRSS } from 'rss-to-json';

async function main() {
    const options = yargs(hideBin(process.argv))
        .command('$0 <path>', 'Render an input html file into an image')
        .positional('path', {
            describe: 'File to render',
            type: "string",
            demandOption: true,
            normalize: true
        })
        .option('output', {
            describe: 'Where to save rendered output',
            type: 'string',
            alias: 'o',
            demandOption: true
        }).option('width', {
            describe: 'Width of the rendered image',
            type: 'number',
            alias: 'w',
            default: 1200
        }).option('height', {
            describe: 'Height of the rendered image',
            type: 'number',
            alias: 'h',
            default: 825
        })
        .strict()
        .help()
        .parseSync();

    const browser = await chromium.launch({
        args: [
            '--disable-lcd-text',
            '--disable-font-subpixel-positioning'
        ]
    });

    const context = await browser.newContext({
        deviceScaleFactor: 2
    });

    await context.route('http://vsb-eink-renderer/rss', async route => {
        const rss = await parseRSS('https://info.sso.vsb.cz/cz.vsb.edison.info.web/rss?orgUnitId=1');
        return route.fulfill({status: 200, json: rss});
    });
    context.on('console', msg => console.log(msg.text()));

    const page = await context.newPage();
    await page.setViewportSize({width: options.width, height: options.height});

    await page.goto(pathToFileURL(options.path).href, { waitUntil: 'networkidle' });
    await page.screenshot({path: options.output});

    await browser.close();
}
main().catch(console.error);

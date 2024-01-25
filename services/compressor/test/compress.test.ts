import { describe, it } from 'node:test';
import * as path from 'node:path';
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import sharp from 'sharp';

import {toRawInkplate10Buffer} from "../src/graphics/compress.js";

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const fixtures = [
	['lenna_src.png', 'lenna_1bpp.bin', '1bpp'],
	['lenna_src.png', 'lenna_4bpp.bin', '4bpp'],
];

describe('toRawInkplate10Buffer', async() => {
	for (const [source, destination, mode] of fixtures) {
		const sourcePath = path.join(__dirname, 'fixtures', source);
		const destinationPath = path.join(__dirname, 'fixtures', destination);

		it(`should convert ${source} to ${destination}`, async() => {
			const inputImage = sharp(sourcePath);
			const outputBuffer = await toRawInkplate10Buffer(inputImage, mode);
			const expectedBuffer = await readFile(destinationPath);
		});
	}
});

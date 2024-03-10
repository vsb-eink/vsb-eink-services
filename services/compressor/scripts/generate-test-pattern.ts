import { writeFile } from 'node:fs/promises';
import {ImageData, setPixel} from '../src/graphics/image.js';
import {toChunks} from "../src/utils/chunks";
import {packNibbles} from "../src/utils/bitwise";

const OUTPUT_FILENAME = process.argv[1];
if (!OUTPUT_FILENAME) process.exit(1);

const image: ImageData = {
	data: new Uint8ClampedArray(1200 * 825),
	width: 1200,
	height: 825,
}

const rowPattern = Buffer.alloc(1200);
for (let i = 0; i < rowPattern.length; i += 150) {
	for (let ii = 0; ii < 150; ++ii) {
		rowPattern[i + ii] = i / 150;
	}
}

for (let row = 0; row < image.height; ++row) {
	for (let col = 0; col < image.width; ++col) {
		setPixel(image, col, row, rowPattern[col]);
	}
}

const buffer = Buffer.alloc(1200 * 825 / 2);
let offset = 0;
for (const pixels of toChunks(image.data, 2)) {
	buffer.writeUInt8(packNibbles(pixels), offset++);
}

await writeFile(OUTPUT_FILENAME, buffer);

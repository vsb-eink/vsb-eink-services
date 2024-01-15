import { Sharp } from 'sharp';
import { ImageData } from './image.js';
import { floydSteinberg } from './dither.js';
import { createLinearQuantiser } from './quantise.js';
import { changeDepth } from './depth.js';
import { toChunks } from '../utils/chunks.js';
import { packBits, packNibbles } from '../utils/bitwise.js';

export const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];
export const isSupportedExtension = (extension: string): extension is SupportedExtension =>
	SUPPORTED_EXTENSIONS.includes(extension as any);

export const SUPPORTED_MIME_TYPES = SUPPORTED_EXTENSIONS.map((ext) => `image/${ext}`);
export const isSupportedMimeType = (mimeType: string): mimeType is SupportedExtension =>
	SUPPORTED_MIME_TYPES.includes(mimeType);

export const SUPPORTED_MODES = ['1bpp', '4bpp'] as const;
export type SupportedMode = (typeof SUPPORTED_MODES)[number];
export const isSupportedMode = (mode: string): mode is SupportedMode =>
	SUPPORTED_MODES.includes(mode as any);

export async function toRawInkplate10Buffer(image: Sharp, mode: SupportedMode) {
	// scale down and convert to grayscale
	const { info, data } = await image
		.grayscale()
		.toColorspace('b-w')
		.resize({
			width: 1200,
			height: 825,
			fit: 'contain',
			background: 'white',
		})
		.raw()
		.toBuffer({ resolveWithObject: true });

	const imageData: ImageData = {
		data: new Uint8ClampedArray(data),
		width: info.width,
		height: info.height,
	};

	if (mode === '1bpp') {
		return toRaw1bpp(imageData);
	}

	if (mode === '4bpp') {
		return toRaw4bpp(imageData);
	}

	throw new Error(`This should never happen`);
}

export async function toRaw1bpp(image: ImageData): Promise<Buffer> {
	let dithered = floydSteinberg(image, createLinearQuantiser(2));
	changeDepth(dithered, 1);

	const buffer = Buffer.alloc(dithered.data.length / 8);
	for (const bits of toChunks(dithered.data, 8)) {
		buffer.writeUInt8(packBits(bits));
	}

	return buffer;
}

export async function toRaw4bpp(image: ImageData): Promise<Buffer> {
	let dithered = floydSteinberg(image, createLinearQuantiser(8));
	changeDepth(dithered, 4);

	const buffer = Buffer.alloc(dithered.data.length / 2);
	for (const bits of toChunks(dithered.data, 4)) {
		buffer.writeUInt8(packNibbles(bits));
	}

	return buffer;
}

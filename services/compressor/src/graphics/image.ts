import { clamp } from '../utils/math.js';

export interface ImageData {
	readonly data: Uint8ClampedArray;
	readonly width: number;
	readonly height: number;
}

export function getPixel(image: Readonly<ImageData>, x: number, y: number): number {
	return image.data[y * image.width + x];
}

export function setPixel(image: ImageData, x: number, y: number, pixel: number): void {
	if (x < 0 || x >= image.width || y < 0 || y >= image.height) {
		return;
	}

	image.data[y * image.width + x] = clamp(pixel, 0, 255);
}

export function addToPixel(image: ImageData, x: number, y: number, value: number): void {
	return setPixel(image, x, y, getPixel(image, x, y) + value);
}

export function invert(image: ImageData): void {
	for (let i = 0; i < image.data.length; ++i) {
		image.data[i] = 255 - image.data[i];
	}
}

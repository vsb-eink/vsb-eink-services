import { ImageData } from './image.js';

export function changeDepth(image: Readonly<ImageData>, depth: number) {
	for (let index = 0; index < image.data.length; ++index) {
		const value = image.data[index];
		const lowered = value / (256 / 2 ** depth);
		const rounded = Math.floor(lowered);
		image.data[index] = rounded >>> 0;
	}
}

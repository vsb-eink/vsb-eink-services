import { ImageData } from './image';

export function changeDepth(image: Readonly<ImageData>, depth: number) {
	for (let i = 0; i < image.data.length; ++i) {
		const value = image.data[i];
		const lowered = value / (256 / 2 ** depth);
		const rounded = Math.floor(lowered);
		image.data[i] = rounded >>> 0;
	}
}

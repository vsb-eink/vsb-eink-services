import { QuantiseFunc } from './quantise.js';
import { getPixel, ImageData, addToPixel, setPixel } from './image.js';
import { clamp } from '../utils/math.js';

export type DitherFunction = (
	source: Readonly<ImageData>,
	destination: ImageData,
	quantise: QuantiseFunc
) => void;

export function floydSteinberg(source: Readonly<ImageData>, quantise: QuantiseFunc): ImageData {
	if (source.data.length !== source.width * source.height) {
		throw new Error('Source must be of a single channel (for now)');
	}

	const destination: ImageData = {
		data: new Uint8ClampedArray(source.data),
		width: source.width,
		height: source.height,
	};

	for (let y = 0; y < destination.height; ++y) {
		for (let x = 0; x < destination.width; ++x) {
			const originalPixel = getPixel(destination, x, y);

			const quantisedPixel = clamp(quantise(originalPixel), 0, 255);

			const error = originalPixel - quantisedPixel;

			setPixel(destination, x, y, quantisedPixel);

			addToPixel(destination, x + 1, y, error * (7 / 16));
			addToPixel(destination, x - 1, y + 1, error * (3 / 16));
			addToPixel(destination, x, y + 1, error * (5 / 16));
			addToPixel(destination, x + 1, y + 1, error * (1 / 16));
		}
	}

	return destination;
}

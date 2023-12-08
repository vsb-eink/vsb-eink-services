export type QuantiseFunc = (pixel: number) => number;

export function createLinearQuantiser(levels: number): QuantiseFunc {
	const step = 256 / levels;
	return (pixel: number) => Math.round(pixel / step) * step;
}

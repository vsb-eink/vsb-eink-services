export function bitLength(n: number) {
	return Math.trunc(Math.log2(n) + 1);
}

export function numberOfOnes(n: number) {
	const length = bitLength(n);
	let cnt = 0;

	for (let i = 0; i < length; ++i) {
		cnt += (n >> i) % 2;
	}

	return cnt;
}

export function oddParity(n: number) {
	// 1 if the number of ones is even
	// 0 if the number of ones is odd
	return +(numberOfOnes(n) % 2);
}

export function packBits(bits: number[], bitLength: number = 1) {
	let packed = 0;

	for (let i = 0; i < bits.length; ++i) {
		// TODO: find easier way to do this
		const offset = (bits.length - 1) * bitLength - i * bitLength;
		packed |= bits[i] << offset;
	}

	return packed;
}

export function packTribits(tribits: number[]) {
	return packBits(tribits, 3);
}

export function packNibbles(nibbles: number[]) {
	return packBits(nibbles, 4);
}

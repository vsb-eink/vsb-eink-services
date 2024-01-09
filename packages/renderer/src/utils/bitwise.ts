export function bitLength(n: number) {
	return Math.trunc(Math.log2(n) + 1);
}

export function numberOfOnes(n: number) {
	const length = bitLength(n);
	let cnt = 0;

	for (let index = 0; index < length; ++index) {
		cnt += (n >> index) % 2;
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

	for (let index = 0; index < bits.length; ++index) {
		// TODO: find easier way to do this
		const offset = (bits.length - 1) * bitLength - index * bitLength;
		packed |= bits[index] << offset;
	}

	return packed;
}

export function packTribits(tribits: number[]) {
	return packBits(tribits, 3);
}

export function packNibbles(nibbles: number[]) {
	return packBits(nibbles, 2);
}

import { TextEncoder, EncodeIntoResult } from 'node:util';

const textEncoder = new TextEncoder();

export function encodeText(text: string): Uint8Array {
	return textEncoder.encode(text);
}

export function encodeInto(text: string, buffer: Uint8Array): EncodeIntoResult {
	return textEncoder.encodeInto(text, buffer);
}

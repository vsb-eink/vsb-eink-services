export async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

interface WaitForOptions {
	delay?: number;
	timeout?: number;
}
export async function waitFor(
	stateFunction: (() => boolean) | (() => Promise<boolean>),
	options?: WaitForOptions
): Promise<void> {
	const options_: Required<WaitForOptions> = {
		delay: options?.delay ?? 50,
		timeout: options?.timeout ?? 0,
	};

	while (true) {
		if (await stateFunction()) return;
		await delay(options_.delay);
	}
}

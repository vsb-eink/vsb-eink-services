export async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

interface WaitForOptions {
	delay?: number;
	timeout?: number;
}
export async function waitFor(
	stateFunc: (() => boolean) | (() => Promise<boolean>),
	options?: WaitForOptions
): Promise<void> {
	const opts: Required<WaitForOptions> = {
		delay: options?.delay ?? 50,
		timeout: options?.timeout ?? 0,
	};

	while (true) {
		if (await stateFunc()) return;
		await delay(opts.delay);
	}
}

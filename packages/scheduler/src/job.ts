import { Cron } from 'croner';

export enum EInkJobAction {
	DISPLAY_FULL = 'full',
	DISPLAY_PARTIAL = 'partial',
}

export interface EInkJob {
	when: string;
	target: string;
	action: EInkJobAction;
	env?: Record<string, string>;
	nativeHandle?: Cron;
	args: string[];
}

export interface EInkJobDisplayFull extends EInkJob {
	action: EInkJobAction.DISPLAY_FULL;
}
export function isEInkJobDisplayFull(job: EInkJob): job is EInkJobDisplayFull {
	return job.action === EInkJobAction.DISPLAY_FULL;
}

export interface EInkJobDisplayPartial extends EInkJob {
	action: EInkJobAction.DISPLAY_PARTIAL;
}
export function isEInkJobDisplayPartial(
	job: EInkJob,
): job is EInkJobDisplayPartial {
	return job.action === EInkJobAction.DISPLAY_PARTIAL;
}

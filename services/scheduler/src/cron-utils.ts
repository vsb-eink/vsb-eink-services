import cronValidateModule from 'cron-validate';

const cronValidate = cronValidateModule.default;

export function isValidCron(cron: string): boolean {
	return isValidCronWithSeconds(cron) || isValidCronWithoutSeconds(cron);
}

export function isValidCronWithSeconds(cron: string): boolean {
	return cronValidate(cron, { preset: 'npm-cron-schedule' }).isValid();
}

export function isValidCronWithoutSeconds(cron: string): boolean {
	return cronValidate(cron, {
		preset: 'npm-cron-schedule',
		override: {
			useSeconds: false,
		},
	}).isValid();
}

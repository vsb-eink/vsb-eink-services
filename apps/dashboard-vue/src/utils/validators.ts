import cronValidate from 'cron-validate';

export type Validator = (value: any) => true | string;

export const isNotEmpty: Validator = (value) => {
	if (value === null || value === undefined || value === '') {
		return 'Toto pole je povinné';
	}
	return true;
};

export const isValidUrl: Validator = (value) => {
	if (!value.match(/^(http|https):\/\/[^ "]+$/)) {
		return 'Zadejte platnou URL adresu';
	}
	return true;
};

export const isValidCron = (cron: string) => {
	const isValidCronWithSeconds = cronValidate(cron, { preset: 'npm-cron-schedule' }).isValid();
	const isValidCronWithoutSeconds = cronValidate(cron, {
		preset: 'npm-cron-schedule',
		override: { useSeconds: false },
	}).isValid();

	return isValidCronWithSeconds || isValidCronWithoutSeconds || 'Neplatný výraz cron';
};

export const isNumber: Validator = (value: string) => {
	if (isNaN(Number(value))) {
		return 'Zadejte číslo';
	}
	return true;
};

export const isInteger: Validator = (value: string) => {
	if (!Number.isInteger(Number(value))) {
		return 'Zadejte celé číslo';
	}
	return true;
};

export const doesNotContainSpaces: Validator = (value: string) => {
	if (value.includes(' ')) {
		return 'Nesmí obsahovat mezery';
	}
	return true;
};

export const isAlphaNumeric: Validator = (value: string) => {
	if (!value.match(/^[a-zA-Z0-9.\-_]*$/)) {
		return 'Řetězec může obsahovat pouze písmena, čísla a znaky ., -, _';
	}
	return true;
};

export const isLowerCase: Validator = (value: string) => {
	if (value !== value.toLowerCase()) {
		return 'Použijte pouze malá písmena';
	}
	return true;
};

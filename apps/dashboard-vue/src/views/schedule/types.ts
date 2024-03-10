interface CommandOption {
	label: string;
	value: string;
	content?: ContentOption;
}

interface ContentOption {
	label: string;
	rules: validationFunc[];
}

type validationFunc = (value: string) => true | string;

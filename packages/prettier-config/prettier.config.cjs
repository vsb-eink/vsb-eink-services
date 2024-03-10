/** @type {import("prettier").Config} */
const config = {
	tabWidth: 4,
	useTabs: true,
	singleQuote: true,
	printWidth: 100,
	overrides: [
		{
			files: ['*.json', '*.yaml', '*.yml'],
			options: {
				useTabs: false,
				tabWidth: 2,
			},
		},
	],
};

module.exports = config;

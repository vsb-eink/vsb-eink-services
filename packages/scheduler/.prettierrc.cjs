/** @type {import("prettier").Config} */
const config = {
	tabWidth: 4,
	useTabs: true,
	singleQuote: true,
	overrides: [
		{
			files: '*.json',
			options: {
				useTabs: false,
				tabWidth: 2,
			},
		},
	],
};

module.exports = config;

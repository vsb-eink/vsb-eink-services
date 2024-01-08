module.exports = {
	root: true,
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'plugin:import/typescript', 'plugin:unicorn/recommended'],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	settings: {
		'import/resolver': {
			typescript: true,
			node: true
		},
	},
	rules: {

	}
};

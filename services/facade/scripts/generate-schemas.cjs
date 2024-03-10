const { mkdtempSync, readFileSync, writeFileSync, renameSync, readdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve, basename, extname } = require('node:path');

const yaml = require('yaml');
const { openapiToTsJsonSchema, fastifyIntegrationPlugin } = require('openapi-ts-json-schema');

const INPUT_FILE = resolve(__dirname, '../openapi.yaml');
const OUTPUT_DIR = resolve(__dirname, '../src/generated-schemas');

function isSupportedPlatform() {
	return ['linux', 'darwin'].includes(process.platform);
}

async function processSpec(inputPath, outputPath) {
	return openapiToTsJsonSchema({
		openApiSchema: inputPath,
		definitionPathsToGenerateFrom: ['paths', 'components.schemas', 'components.responses', 'components.parameters', 'components.requestBodies'],
		refHandling: 'keep',
		outputPath: outputPath,
		plugins: [
			fastifyIntegrationPlugin({
				sharedSchemasFilter: ({ schemaId }) => ['schemas', 'responses', 'requestBodies', 'parameters'].some(componentName => schemaId.startsWith(`/components/${componentName}`)),
			}),
		],
	});
}

async function main() {
	if (!isSupportedPlatform()) {
		console.error('This script is only supported on Linux and macOS');
		process.exit(1);
	}

	console.log(`Preprocessing ${INPUT_FILE}`);
	const inputSpec = yaml.parseDocument(readFileSync(INPUT_FILE, 'utf8'));
	yaml.visit(inputSpec, {
		Pair(_, pair) {
			if (pair.key && pair.key.value === 'securitySchemes') {
				return yaml.visit.REMOVE;
			}
		}
	})
	const modifiedSpecPath = resolve(tmpdir(), `vsb-eink-facade-spec-${new Date().toISOString().replace(/:/g, '-')}.yaml`);
	writeFileSync(modifiedSpecPath, inputSpec.toString(), 'utf8');
	console.log(`Saved preprocessed spec to ${modifiedSpecPath}`);

	console.log(`Generating schemas to ${OUTPUT_DIR}`);
	await processSpec(modifiedSpecPath, OUTPUT_DIR);
	console.log('Schemas generated');

	const generatedPathFiles = readdirSync(resolve(OUTPUT_DIR, 'paths'));
	for (const pathFile of generatedPathFiles) {
		const oldName = pathFile;
		const newName = pathFile.replaceAll('|', '_');
		renameSync(resolve(OUTPUT_DIR, 'paths', oldName), resolve(OUTPUT_DIR, 'paths', newName));
		console.log(`Renamed ${oldName} to ${newName}`);
	}
}
main().catch(console.error);
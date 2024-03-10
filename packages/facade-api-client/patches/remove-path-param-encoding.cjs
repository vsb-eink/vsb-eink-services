#!/usr/bin/env node

const fs = require('fs');

const targetFile = process.argv[2];

if (!targetFile) {
  console.error('Usage: node remove-path-param-encoding.js <target-file>');
  process.exit(1);
}

try {
  fs.accessSync(targetFile, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
  console.error('Target file is not accessible:', targetFile);
  process.exit(1);
}

const targetFileContents = fs.readFileSync(targetFile, 'utf8');
const patchedFileContents = targetFileContents.replaceAll('encodeURIComponent(String(path))', 'String(path)');
fs.writeFileSync(targetFile, patchedFileContents, 'utf8');

console.info('Patched file:', targetFile);
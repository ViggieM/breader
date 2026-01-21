// ABOUTME: Script to remove ICON attributes from bookmark HTML export files
// ABOUTME: Creates a smaller file for testing import functionality

import * as fs from 'node:fs';
import * as path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const inputFile = path.join(projectRoot, 'breader-export-9d5df226.html');
const outputFile = path.join(projectRoot, 'breader-export-no-icons.html');

console.log('Reading input file...');
const content = fs.readFileSync(inputFile, 'utf-8');

console.log('Removing ICON attributes...');
const cleaned = content.replace(/ ICON="[^"]*"/g, '');

console.log('Writing output file...');
fs.writeFileSync(outputFile, cleaned, 'utf-8');

const inputSize = fs.statSync(inputFile).size;
const outputSize = fs.statSync(outputFile).size;

console.log(`\nDone!`);
console.log(`Input:  ${(inputSize / 1024).toFixed(1)} KB`);
console.log(`Output: ${(outputSize / 1024).toFixed(1)} KB`);
console.log(`Saved:  ${((inputSize - outputSize) / 1024).toFixed(1)} KB`);

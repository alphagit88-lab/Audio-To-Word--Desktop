/**
 * generate-latest-yml.js
 * Run after `electron-builder` to auto-generate release/latest.yml
 * for the portable exe (electron-builder only generates it for nsis).
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const pkg     = require('../package.json');
const version = pkg.version;
const exeName = `Audio to Word ${version}.exe`;
const exePath = path.join(__dirname, '..', 'release', exeName);

if (!fs.existsSync(exePath)) {
  console.error(`[generate-latest-yml] ERROR: ${exePath} not found.`);
  process.exit(1);
}

const fileBuffer  = fs.readFileSync(exePath);
const sha512      = crypto.createHash('sha512').update(fileBuffer).digest('base64');
const size        = fs.statSync(exePath).size;
const releaseDate = new Date().toISOString();

const yml = `version: ${version}
files:
  - url: ${exeName}
    sha512: ${sha512}
    size: ${size}
path: ${exeName}
sha512: ${sha512}
releaseDate: '${releaseDate}'
`;

const outPath = path.join(__dirname, '..', 'release', 'latest.yml');
fs.writeFileSync(outPath, yml, 'utf8');

console.log('[generate-latest-yml] Written to:', outPath);
console.log(`  version : ${version}`);
console.log(`  file    : ${exeName}`);
console.log(`  size    : ${size}`);
console.log(`  sha512  : ${sha512}`);

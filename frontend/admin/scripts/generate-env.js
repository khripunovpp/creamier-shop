const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../src/env/environment.ts');
const source = fs.readFileSync(envPath, 'utf8');

// Extract keys from environment object (excluding 'production')
const keyRegex = /^\s+(\w+):/gm;
const keys = [];
let match;
while ((match = keyRegex.exec(source)) !== null) {
  if (match[1] !== 'production') {
    keys.push(match[1]);
  }
}

const values = {};
const missing = [];

for (const key of keys) {
  const envVar = key.replace(/([A-Z])/g, '_$1').toUpperCase();
  const value = process.env[envVar];
  if (!value) {
    missing.push(envVar);
  } else {
    values[key] = value;
  }
}

if (missing.length > 0) {
  console.error(`Error: missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const fields = [
  `  production: true`,
  ...keys.map((key) => `  ${key}: '${values[key]}'`),
].join(',\n');

const content = `export const environment = {\n${fields},\n};\n`;

fs.writeFileSync(envPath, content);
console.log(`Generated environment.ts with: ${keys.map((k) => `${k}=${values[k]}`).join(', ')}`);
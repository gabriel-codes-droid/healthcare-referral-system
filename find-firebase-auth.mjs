import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
const candidates = [
  join(process.env.APPDATA || '', 'configstore', 'firebase-tools.json'),
  join(homedir(), '.config', 'configstore', 'firebase-tools.json'),
  join(homedir(), '.config', 'firebase', 'firebase-tools.json')
];
for (const file of candidates) {
  if (existsSync(file)) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    console.log(JSON.stringify({ file, keys: Object.keys(data), accounts: data.tokens ? Object.keys(data.tokens) : [] }));
  }
}

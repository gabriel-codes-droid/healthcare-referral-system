import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const suffix = process.platform === 'win32' ? '.cmd' : '';
const binaries = [
  ['tsc', '--noEmit'],
  ['vite', 'build']
];

for (const [name, ...args] of binaries) {
  const executable = join('node_modules', '.bin', `${name}${suffix}`);
  const result = spawnSync(executable, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) {
    console.error(`Could not start ${name}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

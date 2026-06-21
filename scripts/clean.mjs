import { existsSync, readdirSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, '..');

const targets = new Set();

const topLevel = ['node_modules', '.turbo', '.npm-cache', '.npm-logs'];
for (const name of topLevel) targets.add(join(REPO_ROOT, name));

const scoped = {
  apps: ['node_modules', '.next'],
  services: ['node_modules', 'dist', 'coverage'],
  packages: ['node_modules', 'dist', 'coverage'],
  agents: ['node_modules'],
};

for (const [dirName, subPaths] of Object.entries(scoped)) {
  const dirPath = join(REPO_ROOT, dirName);
  if (!existsSync(dirPath)) continue;
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    for (const sub of subPaths) {
      targets.add(join(dirPath, entry.name, sub));
    }
  }
}

targets.add(join(REPO_ROOT, 'workflows', 'node_modules'));

for (const path of targets) {
  await rm(path, { recursive: true, force: true });
}

console.log(`Removed ${targets.size} paths.`);

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, '..');

const args = process.argv.slice(2);
const scriptName = args.find((a) => !a.startsWith('-'));
const parallel = args.includes('--parallel');

if (!scriptName) {
  console.error('Usage: node ./scripts/run-workspaces.mjs <script> [--parallel]');
  process.exit(2);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const WORKSPACE_DIRS = ['apps', 'services', 'packages', 'agents'];

const workspaceManifests = [];

for (const dirName of WORKSPACE_DIRS) {
  const dirPath = join(REPO_ROOT, dirName);
  if (!existsSync(dirPath)) continue;
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(dirPath, entry.name, 'package.json');
    if (existsSync(manifestPath)) workspaceManifests.push(manifestPath);
  }
}

const workflowsManifest = join(REPO_ROOT, 'workflows', 'package.json');
if (existsSync(workflowsManifest)) workspaceManifests.push(workflowsManifest);

const workspaces = [];
for (const absPath of workspaceManifests) {
  try {
    const pkg = JSON.parse(readFileSync(absPath, 'utf8'));
    if (!pkg?.name) continue;
    workspaces.push({
      name: pkg.name,
      scripts: pkg.scripts ?? {},
    });
  } catch {
  }
}

const targets = workspaces.filter((w) => Boolean(w.scripts?.[scriptName]));

if (targets.length === 0) {
  console.log(`No workspaces have a "${scriptName}" script.`);
  process.exit(0);
}

function prefixLines(stream, prefix) {
  const rl = readline.createInterface({ input: stream });
  rl.on('line', (line) => {
    process.stdout.write(`${prefix} ${line}\n`);
  });
}

function spawnWorkspace({ name }) {
  const child = spawn(npmCmd, ['run', '-w', name, scriptName], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  prefixLines(child.stdout, `[${name}]`);
  prefixLines(child.stderr, `[${name}]`);

  return child;
}

if (!parallel) {
  for (const target of targets) {
    console.log(`Running "${scriptName}" in ${target.name}...`);
    const exitCode = await new Promise((resolve) => {
      const child = spawnWorkspace(target);
      child.on('exit', (code) => resolve(code ?? 1));
    });
    if (exitCode !== 0) process.exit(exitCode);
  }
  process.exit(0);
}

console.log(`Running "${scriptName}" in ${targets.length} workspaces (parallel)...`);

const children = targets.map(spawnWorkspace);

function shutdown(signal) {
  for (const child of children) {
    try {
      child.kill(signal);
    } catch {
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

let finished = 0;
let firstFailure = null;

await new Promise((resolve) => {
  for (const child of children) {
    child.on('exit', (code) => {
      finished += 1;
      const exitCode = code ?? 1;
      if (exitCode !== 0 && firstFailure === null) {
        firstFailure = exitCode;
        shutdown('SIGTERM');
      }
      if (finished === children.length) resolve();
    });
  }
});

process.exit(firstFailure ?? 0);

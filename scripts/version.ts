import { resolve } from 'node:path';
import * as readline from 'node:readline';

import { Glob } from 'bun';

const ROOT = resolve(import.meta.dirname ?? __dirname, '..');

// Version bump types
type BumpType = 'major' | 'minor' | 'patch' | 'custom';

function parseVersion(version: string): [number, number, number] {
  const [major, minor, patch] = version.split('.').map(Number);
  return [major || 0, minor || 0, patch || 0];
}

function bumpVersion(current: string, type: BumpType): string {
  const [major, minor, patch] = parseVersion(current);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return current;
  }
}

async function getPackageFiles(): Promise<string[]> {
  const files: string[] = [];
  const patterns = ['package.json', 'packages/*/package.json', 'tools/*/package.json', 'apps/*/package.json'];

  for (const pattern of patterns) {
    const glob = new Glob(pattern);
    for await (const file of glob.scan({ cwd: ROOT, absolute: true })) {
      files.push(file);
    }
  }
  return files;
}

async function getCurrentVersion(): Promise<string> {
  const rootPkg = await Bun.file(resolve(ROOT, 'package.json')).json();
  return rootPkg.version || '0.0.0';
}

async function updateVersion(files: string[], newVersion: string): Promise<void> {
  for (const file of files) {
    const pkg = await Bun.file(file).json();
    pkg.version = newVersion;
    await Bun.write(file, JSON.stringify(pkg, null, 2) + '\n');
    const relativePath = file.replace(ROOT, '.').replaceAll('\\', '/');
    console.log(`  📦 ${relativePath}`);
  }
}

function cancel(): never {
  console.log('\n\n  👋 Cancelled!\n');
  process.exit(0);
}

// Handle Ctrl+C globally
process.on('SIGINT', cancel);

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Handle Escape key
    process.stdin.setRawMode?.(true);
    const onKeypress = (key: Buffer) => {
      if (key[0] === 27) { // Escape
        process.stdin.setRawMode?.(false);
        process.stdin.off('data', onKeypress);
        rl.close();
        cancel();
      }
    };
    process.stdin.on('data', onKeypress);

    rl.question(question, (answer) => {
      process.stdin.setRawMode?.(false);
      process.stdin.off('data', onKeypress);
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Main
const files = await getPackageFiles();
const currentVersion = await getCurrentVersion();
const arg = process.argv[2];

console.log(`\n  🏷️  Current version: ${currentVersion}`);
console.log(`  📁 Files to update: ${files.length}\n`);

let newVersion: string;

if (arg && /^\d+\.\d+\.\d+/.test(arg)) {
  // Direct version provided
  newVersion = arg;
} else if (arg === 'patch' || arg === 'minor' || arg === 'major') {
  // Bump type provided
  newVersion = bumpVersion(currentVersion, arg);
} else {
  // Interactive menu
  const [major, minor, patch] = parseVersion(currentVersion);
  console.log('  🎯 Select version:\n');
  console.log(`    1) 🩹 patch  → ${major}.${minor}.${patch + 1}`);
  console.log(`    2) ✨ minor  → ${major}.${minor + 1}.0`);
  console.log(`    3) 🚀 major  → ${major + 1}.0.0`);
  console.log('    4) 🎨 custom\n');

  const choice = await prompt('  👉 Choice [1-4]: ');

  switch (choice) {
    case '1':
      newVersion = bumpVersion(currentVersion, 'patch');
      break;
    case '2':
      newVersion = bumpVersion(currentVersion, 'minor');
      break;
    case '3':
      newVersion = bumpVersion(currentVersion, 'major');
      break;
    case '4':
      newVersion = await prompt('  🎨 Enter version: ');
      break;
    default:
      console.log('\n  👋 Cancelled!');
      process.exit(0);
  }
}

if (!newVersion || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
  console.log(`\n  ❌ Invalid version: ${newVersion}`);
  process.exit(1);
}

console.log(`\n  🔄 ${currentVersion} → ${newVersion}\n`);
await updateVersion(files, newVersion);
console.log('\n  ✅ Done! (◕‿◕)\n');

import { join } from 'path';
import { readFile } from 'fs/promises';

// This is a bit hacky, but we're either in src/support/getVersion.ts or we're
// in the final bundled index.js
const projectRoot = __dirname.endsWith('/src/support')
  ? join(__dirname, '../..')
  : __dirname;

async function getPackageVersion() {
  try {
    const source = await readFile(join(projectRoot, 'package.json'), 'utf8');
    const parsed: unknown = JSON.parse(source);
    const version: unknown = Object(parsed).version;
    return typeof version === 'string' ? version : undefined;
  } catch (e) {}
}

export async function getVersion() {
  const version = await getPackageVersion();
  return version ?? '0.0.0';
}

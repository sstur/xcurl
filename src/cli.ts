/* eslint-disable no-console */
import { readFile } from 'fs/promises';
import { join } from 'path';

import fetch from 'node-fetch';
import mri from 'mri';

let argv = process.argv.slice(2);

let args = mri(argv, {
  alias: {
    d: 'data',
    f: 'fail',
    h: 'help',
    i: 'include',
    o: 'output',
    O: 'remote-name',
    s: 'silent',
    T: 'upload-file',
    u: 'user',
    A: 'user-agent',
    v: 'verbose',
    V: 'version',
  },
  boolean: ['f', 'h', 'i', 'O', 's', 'v', 'V'],
  string: ['d', 'o', 'T', 'u', 'A'],
  unknown: (input) => {
    console.log(`Unknown argument: ${input}`);
    process.exit(1);
  },
});

async function main() {
  if (args.help) {
    let usage = await readFile(join(__dirname, '../usage.txt'), 'utf8');
    console.log(usage);
    process.exit(0);
  }

  let url = args._[0] || '';

  let response = await fetch(url);
  let result = await response.text();
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

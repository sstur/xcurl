/* eslint-disable no-console */
import fetch from 'node-fetch';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

import cliArgSchema from './cliArgSchema';

function printUsage() {
  let sections = [
    {
      header: 'Usage: curl [options...] <url>',
      optionList: cliArgSchema,
    },
  ];
  let usage = commandLineUsage(sections);
  console.log(usage);
}

async function main() {
  let argv = process.argv.slice(2);
  let isHelp = argv.some((arg) => arg === '-h' || arg === '--help');
  let isVersion = argv.some((arg) => arg === '-V' || arg === '--version');
  let url = isHelp || isVersion ? '' : argv.pop() ?? '';
  let args = commandLineArgs(cliArgSchema, { argv });

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (args.version) {
    // TODO: Get version from package.json
    console.log('xcurl v0.0.0');
    process.exit(0);
  }

  let response = await fetch(url);
  let result = await response.text();
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/* eslint-disable no-console */
import fetch from 'node-fetch';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

import cliArgSchema from './cliArgSchema';
import { isValidUrl } from './support/isValidUrl';
import { AbortError } from './support/Errors';

// Will be either `xcurl` or `curl` depending on how the script was invoked.
const CMD = (process.argv[1] || '').split('/').pop();

function printUsage() {
  let sections = [
    {
      header: `Usage: ${CMD} [options...] <url>`,
      optionList: cliArgSchema,
    },
  ];
  let usage = commandLineUsage(sections);
  console.log(usage);
}

async function main() {
  let argv = process.argv.slice(2);
  let args = commandLineArgs(cliArgSchema, { argv, partial: true });

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (args.version) {
    // TODO: Get version from package.json
    console.log('xcurl v0.0.0');
    process.exit(0);
  }

  // eslint-disable-next-line no-underscore-dangle
  let bareArgs = args._unknown || [];
  for (let item of bareArgs) {
    if (!isValidUrl(item)) {
      if (item.startsWith('-')) {
        throw new AbortError(`option ${item}: is unknown`);
      } else {
        throw new AbortError('invalid URL specified');
      }
    }
  }

  if (bareArgs.length === 0) {
    throw new AbortError('no URL specified!');
  }
  // Actually `curl` does support multiple URLs, but in our current
  // implementation we don't.
  if (bareArgs.length > 1) {
    throw new AbortError(`multiple URLs specified: ${bareArgs.join(' ')}`);
  }
  let url = bareArgs[0] || '';
  let response = await fetch(url);
  let result = await response.text();
  console.log(result);
}

main().catch((e) => {
  if (e instanceof AbortError) {
    console.log(`${CMD}: ${e.message}`);
  } else {
    console.error(e);
  }
  process.exit(1);
});

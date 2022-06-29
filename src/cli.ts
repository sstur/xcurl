import { URL } from 'url';

import fetch from 'node-fetch';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

import cliArgSchema from './cliArgSchema';
import { isValidUrl } from './support/isValidUrl';
import { AbortError } from './support/Errors';

// Will be either `xcurl` or `curl` depending on how the script was invoked.
const CMD = (process.argv[1] || '').split('/').pop();

async function main() {
  let argv = process.argv.slice(2);
  let args = commandLineArgs(cliArgSchema, { argv, partial: true });

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (args.version) {
    // TODO: Get version from package.json
    print('xcurl v0.0.0');
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
  let parsed = new URL(url);
  let response;
  try {
    response = await fetch(url);
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message.includes('reason: getaddrinfo ENOTFOUND')) {
        throw new AbortError(`(6) Could not resolve host: ${parsed.hostname}`);
      }
    }
    throw e;
  }
  if (args.include) {
    // TODO: Determine the correct HTTP version
    print(`HTTP/2 ${response.status} ${response.statusText}`);
    for (let [key, value] of response.headers) {
      print(`${key.toLowerCase()}: ${value}`);
    }
    print('');
  }
  let result = await response.text();
  print(result);
}

main().catch((e) => {
  if (e instanceof AbortError) {
    print(`${CMD}: ${e.message}`);
  } else {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  process.exit(1);
});

function printUsage() {
  let sections = [
    {
      header: `Usage: ${CMD} [options...] <url>`,
      optionList: cliArgSchema,
    },
  ];
  let usage = commandLineUsage(sections);
  print(usage);
}

function print(text: string) {
  // eslint-disable-next-line no-console
  console.log(text);
}

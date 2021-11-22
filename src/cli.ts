/* eslint-disable no-console */
import fetch from 'node-fetch';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

import cliArgSchema from './cliArgSchema';
import { isValidUrl } from './support/isValidUrl';

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

// TODO: Allow a custom error to be thrown for user-facing errors so we can
// catch it and display error messages that match the ones from the real `curl`
// listed below. Also, abstract the use of the word `curl`.
// curl: no URL specified!
// curl: (6) Could not resolve host: __
// curl: option --foo: is unknown
// curl: try 'curl --help' for more information

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
        throw new Error(`option ${item}: is unknown`);
      } else {
        throw new Error('invalid URL specified');
      }
    }
  }

  if (bareArgs.length === 0) {
    throw new Error('no URL specified!');
  }
  // Actually `curl` does support multiple URLs, but in our current
  // implementation we don't.
  if (bareArgs.length > 1) {
    throw new Error(`multiple URLs specified: ${bareArgs.join(' ')}`);
  }
  let url = bareArgs[0] || '';
  let response = await fetch(url);
  let result = await response.text();
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

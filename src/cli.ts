import { join } from 'path';
import { createWriteStream } from 'fs';
import { StringDecoder } from 'string_decoder';

import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

import cliArgSchema from './cliArgSchema';
import { parseUrl } from './support/parseUrl';
import { AbortError } from './support/Errors';
import { getFetchOptions } from './support/getFetchOptions';
import { fetch } from './support/fetch';

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
  for (let arg of bareArgs) {
    if (arg.startsWith('-')) {
      throw new AbortError(`option ${arg}: is unknown`);
    }
  }

  if (bareArgs.length === 0) {
    throw new AbortError('no URL specified!');
  }
  // Actually `curl` does support multiple URLs, but currently in this
  // implementation we don't.
  if (bareArgs.length > 1) {
    throw new AbortError(`multiple URLs specified: ${bareArgs.join(' ')}`);
  }
  let inputUrl = bareArgs[0] || '';
  let parsed = parseUrl(inputUrl);
  if (!parsed) {
    throw new AbortError(`(3) URL using bad/illegal format or missing URL`);
  }
  let requestOptions = getFetchOptions(parsed, args);
  let response;
  if (args.verbose) {
    let { method, headers } = requestOptions;
    let path = parsed.pathname + parsed.search;
    print(`> ${method.toUpperCase()} ${path} HTTP/1.1`);
    for (let [name, value] of headers.toFlatList()) {
      print(`> ${name}: ${value}`);
    }
    print(`>`);
  }
  try {
    response = await fetch(parsed, requestOptions);
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message.includes('reason: getaddrinfo ENOTFOUND')) {
        throw new AbortError(`(6) Could not resolve host: ${parsed.hostname}`);
      }
    }
    throw e;
  }
  if (args.verbose || args.include) {
    let prefix = args.verbose ? '< ' : '';
    print(`${prefix}HTTP/1.1 ${response.status} ${response.statusText}`);
    for (let [name, value] of response.headers.toFlatList()) {
      print(`${prefix}${name}: ${value}`);
    }
    print(prefix);
  }
  if (args.output) {
    let filePath = join(process.cwd(), args.output);
    let writeStream = createWriteStream(filePath);
    let { body } = response;
    await new Promise<void>((resolve, reject) => {
      body.pipe(writeStream);
      body.on('end', resolve);
      body.on('error', reject);
    });
    print(`Saved output to: ${filePath}`);
  } else {
    let { body } = response;
    let decoder = new StringDecoder('utf8');
    body.on('data', (chunk) => {
      let string = decoder.write(chunk);
      process.stdout.write(string);
    });
    body.on('error', (error) => {
      print('');
      // TODO: Better error handling.
      print(String(error));
    });
    body.on('end', () => {
      let string = decoder.end();
      process.stdout.write(string);
    });
  }
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

import { join } from 'path';
import { createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { StringDecoder } from 'string_decoder';

import { createParser, renderUsage } from '@sstur/clargs';

import { schema } from './cliArgSchema';
import { parseUrl } from './support/parseUrl';
import { AbortError } from './support/Errors';
import { getFetchOptions } from './support/getFetchOptions';
import { fetch } from './support/fetch';

// Will be either `xcurl` or `curl` depending on how the script was invoked.
const CMD = (process.argv[1] || '').split('/').pop();

async function main() {
  let argv = process.argv.slice(2);
  let parser = createParser(schema);
  let args = parser.parse(argv);

  if (args.help) {
    printUsage();
    return;
  }

  if (args.version) {
    const root = __dirname.endsWith('/src') ? join(__dirname, '..') : __dirname;
    const source = await readFile(join(root, 'package.json'), 'utf8');
    const parsed = JSON.parse(source);
    const version = parsed.version || '0.0.0';
    print(`xcurl v${version}`);
    return;
  }

  let bareArgs = args._rest;
  for (let arg of bareArgs) {
    if (arg.startsWith('-')) {
      throw new AbortError(`option ${arg}: is unknown`);
    }
  }

  let inputUrl = args.url || bareArgs.shift() || '';
  if (!inputUrl) {
    throw new AbortError('no URL specified!');
  }
  let parsed = parseUrl(inputUrl);
  if (!parsed) {
    throw new AbortError(`(3) URL using bad/illegal format or missing URL`);
  }

  // Actually `curl` does support multiple URLs, but currently in this
  // implementation we don't.
  if (bareArgs.length) {
    throw new AbortError(`extraneous option: ${bareArgs[0]}`);
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
  const header = `Usage: ${CMD} [options...] <url>`;
  const usage = renderUsage(schema, { header });
  print(usage);
}

function print(text: string) {
  process.stdout.write(text.slice(-1) === '\n' ? text : text + '\n');
}

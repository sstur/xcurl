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

const print = createLineWriter(process.stdout);
const notice = createLineWriter(process.stderr);

async function main() {
  const argv = process.argv.slice(2);
  const parser = createParser(schema);
  const args = parser.parse(argv);

  if (args.help) {
    print(usage());
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

  const outFile = args.output ? join(process.cwd(), args.output) : null;
  const stdout: NodeJS.WritableStream = outFile
    ? createWriteStream(outFile)
    : process.stdout;
  const output = createLineWriter(stdout);
  const isTTY = Boolean(Object(stdout).isTTY);

  const bareArgs = args._rest;
  for (const arg of bareArgs) {
    if (arg.startsWith('-')) {
      throw new AbortError(`option ${arg}: is unknown`);
    }
  }

  const inputUrl = args.url || bareArgs.shift() || '';
  if (!inputUrl) {
    throw new AbortError('no URL specified!');
  }
  const parsed = parseUrl(inputUrl);
  if (!parsed) {
    throw new AbortError(`(3) URL using bad/illegal format or missing URL`);
  }

  // Actually `curl` does support multiple URLs, but currently in this
  // implementation we don't.
  if (bareArgs.length) {
    throw new AbortError(`extraneous option: ${bareArgs[0]}`);
  }

  const startTime = Date.now();
  const requestOptions = getFetchOptions(parsed, args);
  let response;
  if (args.verbose) {
    const { method, headers } = requestOptions;
    const path = parsed.pathname + parsed.search;
    output(`> ${method.toUpperCase()} ${path} HTTP/1.1`);
    for (const [name, value] of headers.toFlatList()) {
      output(`> ${name}: ${value}`);
    }
    output(`>`);
  }
  try {
    response = await fetch(parsed, requestOptions);
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (Object(e).code === 'ENOENT') {
        const path = String(Object(e).path);
        throw new AbortError(`Couldn't read data from file "${path}"`);
      }
      if (e.message.includes('reason: getaddrinfo ENOTFOUND')) {
        throw new AbortError(`(6) Could not resolve host: ${parsed.hostname}`);
      }
    }
    throw e;
  }
  if (args.verbose || args.include) {
    const prefix = args.verbose ? '< ' : '';
    output(`${prefix}HTTP/1.1 ${response.status} ${response.statusText}`);
    for (const [name, value] of response.headers.toFlatList()) {
      output(`${prefix}${name}: ${value}`);
    }
    output(prefix);
  }
  const { body } = response;
  let bytesReceived = 0;
  let timeElapsed = 0;
  body.on('data', (chunk) => {
    bytesReceived += chunk.length;
  });
  body.on('end', () => {
    timeElapsed = Date.now() - startTime;
    if (!isTTY && !args.silent) {
      notice(
        `Received ${bytesReceived} of ${bytesReceived} in ${timeElapsed} ms`,
      );
    }
  });
  // If we're writing to an interactive terminal, let's convert to string
  if (isTTY) {
    await pipeAsString(body, stdout);
  } else {
    await pipe(body, stdout);
  }
  if (outFile && !args.silent) {
    notice(`Saved output to: ${outFile}`);
  }
}

main().catch((e) => {
  if (e instanceof AbortError) {
    notice(`${CMD}: ${e.message}`);
  } else {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  process.exit(1);
});

function pipe(
  readStream: NodeJS.ReadableStream,
  writeStream: NodeJS.WritableStream,
) {
  return new Promise<void>((resolve, reject) => {
    readStream.pipe(writeStream);
    readStream.on('end', resolve);
    readStream.on('error', reject);
  });
}

function pipeAsString(
  readStream: NodeJS.ReadableStream,
  writeStream: NodeJS.WritableStream,
) {
  return new Promise<void>((resolve, reject) => {
    const decoder = new StringDecoder('utf8');
    readStream.on('data', (chunk) => {
      const string = decoder.write(chunk);
      writeStream.write(string);
    });
    readStream.on('error', (error) => {
      reject(error);
    });
    readStream.on('end', () => {
      const string = decoder.end();
      writeStream.write(string);
      resolve();
    });
  });
}

function usage() {
  const header = `Usage: ${CMD} [options...] <url>`;
  return renderUsage(schema, { header });
}

function createLineWriter(writeStream: NodeJS.WritableStream) {
  return (text: string) => {
    const output = text.slice(-1) === '\n' ? text : text + '\n';
    writeStream.write(output);
  };
}

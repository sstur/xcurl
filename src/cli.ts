import { resolve } from 'path';
import { Writable } from 'stream';
import {
  type ReadableStream,
  TextDecoderStream,
  TransformStream,
} from 'stream/web';

import { createParser, renderUsage } from '@sstur/clargs';

import { type ParsedOptions, schema } from './cliArgSchema';
import { parseUrl } from './support/parseUrl';
import { AbortError } from './support/Errors';
import { initRequest } from './support/initRequest';
import { parseHeaderValue } from './support/parseHeaderValue';
import { createWriteStreamFromFile } from './support/createWriteStreamFromFile';
import { getVersion } from './support/getVersion';
import { createLineWriter } from './support/createLineWriter';

// Will be either `xcurl` or `curl` depending on how the script was invoked.
const CMD = (process.argv[1] || '').split('/').pop() ?? '';

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
    const version = await getVersion();
    print(`xcurl v${version}`);
    return;
  }

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
  const url = parseUrl(inputUrl);
  if (!url) {
    throw new AbortError(`(3) URL using bad/illegal format or missing URL`);
  }

  // Actually `curl` does support multiple URLs, but currently in this
  // implementation we don't.
  if (bareArgs.length) {
    throw new AbortError(`extraneous option: ${bareArgs[0]}`);
  }

  const startTime = Date.now();
  const request = await invokeWithErrorHandler(
    () => initRequest(url, args),
    handleRequestError,
  );

  // Make a copy of the request headers (for use below) and then remove
  // Transfer-Encoding, otherwise Node will throw UND_ERR_INVALID_ARG
  const requestHeaders = new Headers(request.headers);
  request.headers.delete('Transfer-Encoding');

  const response = await invokeWithErrorHandler(
    () => fetch(request),
    handleRequestError,
  );

  const outputFileName = getOutputFileName(url, args, response.headers);

  const outputStream: Writable = outputFileName
    ? await invokeWithErrorHandler(
        () => createWriteStreamFromFile(outputFileName),
        handleOutputFileError,
      )
    : process.stdout;

  // This is used to output some logging if `-i` or `-v` is used.
  // For `-i` we'll output to the same destination as the data (stdout or file)
  // but with `-v` we'll always output to stderr.
  const writeLine = createLineWriter(
    args.verbose ? process.stderr : outputStream,
  );
  const isTTY = outputFileName ? false : process.stdout.isTTY;

  if (args.verbose) {
    const method = request.method ?? 'GET';
    const path = url.pathname + url.search;
    writeLine(`> ${method.toUpperCase()} ${path} HTTP/1.1`);
    for (const [name, value] of requestHeaders.entries()) {
      writeLine(`> ${name}: ${value}`);
    }
    writeLine(`>`);
  }

  if (args.verbose || args.include) {
    const prefix = args.verbose ? '< ' : '';
    writeLine(`${prefix}HTTP/1.1 ${response.status} ${response.statusText}`);
    for (const [name, value] of response.headers.entries()) {
      writeLine(`${prefix}${name}: ${value}`);
    }
    writeLine(prefix);
  }
  const body: ReadableStream<Uint8Array> | null = response.body;
  let bytesReceived = 0;
  if (body) {
    const byteCountingStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.length;
        controller.enqueue(chunk);
      },
    });
    const writableStream = Writable.toWeb(outputStream);
    // If we're writing to an interactive terminal, convert to string. By
    // default this will attempt to decode as utf-8, and on invalid byte
    // sequence will instead render a replacement character (\uFFFD).
    if (isTTY) {
      const textDecoderStream = new TextDecoderStream();
      await body
        .pipeThrough(byteCountingStream)
        .pipeThrough(textDecoderStream)
        .pipeTo(writableStream);
    } else {
      await body.pipeThrough(byteCountingStream).pipeTo(writableStream);
    }
  }
  const timeElapsed = Date.now() - startTime;
  if (!isTTY && !args.silent) {
    notice(`Received ${bytesReceived} bytes in ${timeElapsed} ms`);
  }
  if (outputFileName && !args.silent) {
    notice(`Saved output to: ${outputFileName}`);
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

function getOutputFileName(
  url: URL,
  args: ParsedOptions,
  responseHeaders: Headers,
): string | null {
  if (args.output) {
    return resolve(process.cwd(), args.output);
  }
  const useNameFromUrl = args['remote-name'];
  if (!useNameFromUrl) {
    return null;
  }
  const useNameFromHeader = args['remote-header-name'];
  if (useNameFromHeader) {
    const contentDispositionRaw = responseHeaders.get('content-disposition');
    const [_, params] = parseHeaderValue(contentDispositionRaw);
    const name = params.get('filename');
    if (name) {
      return name;
    }
  }
  const fileName = url.pathname.split('/').pop();
  if (fileName) {
    return fileName;
  }
  return null;
}

async function invokeWithErrorHandler<T>(
  fn: () => Promise<T>,
  errorHandler: (e: unknown) => void,
) {
  try {
    return await fn();
  } catch (e) {
    errorHandler(e);
    throw e;
  }
}

function handleRequestError(e: unknown) {
  if (e instanceof Error) {
    const error: Record<string, unknown> = Object(e);
    if (error.code === 'ENOENT') {
      const path = String(error.path);
      throw new AbortError(`Failed to open "${path}"`);
    }
    // Error: getaddrinfo ENOTFOUND {hostname}
    if (error.code === 'ENOTFOUND') {
      const hostname = String(error.hostname);
      throw new AbortError(`(6) Could not resolve host: ${hostname}`);
    }
  }
  if (e instanceof TypeError && e.message === 'fetch failed' && e.cause) {
    handleRequestError(e.cause);
  }
}

function handleOutputFileError(e: unknown) {
  if (e instanceof Error) {
    const error: Record<string, unknown> = Object(e);
    if (error.code === 'ENOENT') {
      const path = String(error.path);
      throw new AbortError(
        `(23) Failure writing output to destination "${path}"`,
      );
    }
  }
}

function usage() {
  const header = `Usage: ${CMD} [options...] <url>`;
  return renderUsage(schema, { header });
}

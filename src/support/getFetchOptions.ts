import { URL } from 'url';
import { join } from 'path';
import { Readable } from 'stream';
import { createReadStream } from 'fs';

import { ParsedOptions } from '../cliArgSchema';

import { Headers } from './Headers';
import { FetchOptions } from './fetch';

const methodsWithBody: Record<string, true> = {
  post: true,
  put: true,
};

const methodsWithoutBody: Record<string, true> = {
  delete: true,
  get: true,
  head: true,
  options: true,
};

const validMethods = { ...methodsWithBody, ...methodsWithoutBody };

export function getFetchOptions(url: URL, args: ParsedOptions): FetchOptions {
  let method = (args.request ?? '').toLowerCase();
  const headersArray = args.header;
  const headers = new Headers();
  const defaultHeaders = new Map([
    ['Host', url.host],
    ['User-Agent', 'curl'],
    ['Accept', '*/*'],
  ]);
  for (const header of headersArray) {
    const parsed = parseHeader(header);
    if (parsed) {
      const [name, value] = parsed;
      headers.append(name, value);
    }
  }
  for (const [name, value] of defaultHeaders) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }
  const data =
    args.data ?? args['data-ascii'] ?? args['data-binary'] ?? args['data-raw'];
  let fromFile: string | undefined;
  if (!args['data-raw'] && data?.startsWith('@')) {
    fromFile = join(process.cwd(), data.slice(1));
  }
  let body: Buffer | Readable | undefined;
  if (fromFile) {
    body = createReadStream(fromFile);
  } else {
    body = data ? Buffer.from(data, 'utf-8') : undefined;
  }

  if (body !== undefined && methodsWithBody[method] !== true) {
    method = 'post';
  } else if (validMethods[method] !== true) {
    method = 'get';
  }
  if (body !== undefined) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
    }
    if (Buffer.isBuffer(body)) {
      headers.set('Content-Length', body.length.toString());
    }
  }
  return {
    method,
    headers,
    body,
  };
}

function parseHeader(input: string): [string, string] | null {
  const [name, ...values] = input.split(':');
  if (name && values.length) {
    const value = values.join(':');
    return [name.trim(), value.trim()];
  }
  return null;
}

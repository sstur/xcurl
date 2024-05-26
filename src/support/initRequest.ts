import { resolve } from 'path';
import type { URL } from 'url';
import type { ReadableStream } from 'stream/web';
import { Readable } from 'stream';

import type { ParsedOptions } from '../cliArgSchema';

import { createReadStreamFromFile } from './createReadStreamFromFile';

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

export async function initRequest(
  url: URL,
  args: ParsedOptions,
): Promise<Request> {
  let method = (args.request ?? '').toLowerCase();
  const headersArray = args.header;
  const headers = new Headers();
  const defaultHeaders = new Map([
    ['Host', url.host],
    ['User-Agent', 'curl'],
    ['Accept', '*/*'],
  ]);
  const basicAuth = args.user;
  if (basicAuth) {
    headers.set('Authorization', `Basic ${btoa(basicAuth)}`);
  }
  for (const header of headersArray) {
    const parsed = parseHeader(header);
    if (parsed) {
      const [name, value] = parsed;
      headers.set(name, value);
    }
  }
  for (const [name, value] of defaultHeaders) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }

  const data = args.data ?? args['data-ascii'] ?? args['data-binary'];
  const rawData = args['data-raw'];
  const body = await initRequestBody(headers, rawData ?? data, {
    raw: rawData !== undefined,
  });
  if (body !== undefined && methodsWithBody[method] !== true) {
    method = 'post';
  } else if (validMethods[method] !== true) {
    method = 'get';
  }

  // Curl will always default to urlencoded, even if a binary file is specified
  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
  }
  const isBodyStream = body !== undefined && !Buffer.isBuffer(body);
  return new Request(url, {
    method,
    headers,
    body,
    redirect: args.location ? 'follow' : 'manual',
    duplex: isBodyStream ? 'half' : undefined,
  });
}

async function initRequestBody(
  headers: Headers,
  data: string | undefined,
  opts: { raw: boolean },
): Promise<Buffer | ReadableStream | undefined> {
  const { raw } = opts;
  if (!data) {
    return;
  }
  if (raw || !data.startsWith('@')) {
    const buffer = Buffer.from(data, 'utf-8');
    headers.set('Content-Length', String(buffer.length));
    return buffer;
  }
  const fileName = data.slice(1);
  if (fileName === '-') {
    headers.set('Transfer-Encoding', 'chunked');
    return Readable.toWeb(process.stdin);
  }
  const fullFilePath = resolve(process.cwd(), fileName);
  const [readStream, { size }] = await createReadStreamFromFile(fullFilePath);
  headers.set('Content-Length', String(size));
  return Readable.toWeb(readStream);
}

function parseHeader(input: string): [string, string] | null {
  const [name, ...values] = input.split(':');
  if (name && values.length) {
    const value = values.join(':');
    return [name.trim(), value.trim()];
  }
  return null;
}

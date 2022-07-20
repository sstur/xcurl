import { URL } from 'url';

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
  let headersArray = args.header;
  let headers = new Headers();
  let defaultHeaders = new Map([
    ['Host', url.host],
    ['User-Agent', 'curl'],
    ['Accept', '*/*'],
  ]);
  for (let header of headersArray) {
    let parsed = parseHeader(header);
    if (parsed) {
      let [name, value] = parsed;
      headers.append(name, value);
    }
  }
  for (let [name, value] of defaultHeaders) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }
  let { data } = args;
  let body = data ? Buffer.from(data, 'utf-8') : null;
  if (body != null && methodsWithBody[method] !== true) {
    method = 'post';
  } else if (validMethods[method] !== true) {
    method = 'get';
  }
  if (body != null) {
    if (body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
    }
    headers.set('Content-Length', body.length.toString());
  }
  return {
    method,
    headers,
    body: body ?? undefined,
  };
}

function parseHeader(input: string): [string, string] | null {
  let [name, ...values] = input.split(':');
  if (name && values.length) {
    let value = values.join(':');
    return [name.trim(), value.trim()];
  }
  return null;
}

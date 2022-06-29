import { URL } from 'url';

import { Headers, RequestInit } from 'node-fetch';
import { CommandLineOptions } from 'command-line-args';

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

export function getFetchOptions(
  url: URL,
  args: CommandLineOptions,
): RequestInit {
  let method = toString(args.request, '').toLowerCase();
  let headersArray = toStringArray(args.header);
  let headers = new Headers();
  for (let header of headersArray) {
    let parsed = parseHeader(header);
    if (parsed) {
      let [name, value] = parsed;
      headers.append(name, value);
    }
  }
  let body = toString(args.data, null);
  if (body != null && methodsWithBody[method] !== true) {
    method = 'post';
  } else if (validMethods[method] !== true) {
    method = 'get';
  }
  if (body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
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

function toString<T = null>(value: unknown, fallback: T): string | T {
  return typeof value === 'string' ? value : fallback;
}

function toStringArray(input: unknown): Array<string> {
  return Array.isArray(input)
    ? input.filter((el) => typeof el === 'string')
    : [];
}

import { URL } from 'url';

import { RequestInit } from 'node-fetch';
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
  let body = toString(args.data, null);
  if (body != null && methodsWithBody[method] !== true) {
    method = 'post';
  } else if (validMethods[method] !== true) {
    method = 'get';
  }
  return {
    method,
    body: body ?? undefined,
  };
}

function toString<T = null>(value: unknown, fallback: T): string | T {
  return typeof value === 'string' ? value : fallback;
}

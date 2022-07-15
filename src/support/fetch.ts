import { URL } from 'url';
import { Readable } from 'stream';

import { createRequest } from './createRequest';
import { Headers } from './Headers';

export type FetchOptions = {
  method: string;
  headers: Headers;
  body: Buffer | undefined;
};

type Response = {
  status: number;
  statusText: string;
  headers: Headers;
  body: Readable;
};

export function fetch(url: URL, options: FetchOptions): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = createRequest(url, {
      method: options.method ?? 'GET',
      headers: options.headers.toObject(),
    });
    if (options.body) {
      request.write(options.body);
    }
    request.end();

    request.on('error', (error) => {
      reject(error);
    });

    request.on('response', (response) => {
      const { statusCode, statusMessage, rawHeaders } = response;
      const headers = new Headers();
      for (let i = 0; i < rawHeaders.length; i++) {
        let name = rawHeaders[i] ?? '';
        let value = rawHeaders[++i] ?? '';
        headers.append(name, value);
      }
      resolve({
        status: statusCode ?? 0,
        statusText: statusMessage ?? '',
        headers,
        body: response,
      });
    });
  });
}

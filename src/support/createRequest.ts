import { type URL } from 'url';
import { request as requestHttp } from 'http';
import { request as requestHttps } from 'https';

type Options = {
  method: string;
  headers: { [name: string]: string | Array<string> };
};

export function createRequest(url: URL, options: Options) {
  return url.protocol === 'http:'
    ? requestHttp(url.toString(), options)
    : requestHttps(url.toString(), options);
}

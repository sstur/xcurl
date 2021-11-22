// Loosely based on: https://github.com/developit/unfetch/blob/master/src/index.mjs
type Method = 'get' | 'delete' | 'post' | 'put';

type RequestOptions = {
  body?: string;
  headers?: Record<string, string>;
  // integrity?: string;
  // keepalive?: boolean;
  method?: Method;
  // mode?: RequestMode_;
  // referrer?: string;
  // window?: any;
  // signal?: AbortSignal;
};

export function fetch(url: string, options: RequestOptions = {}) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    let keys: Array<string> = [];
    let all: Array<[string, string]> = [];
    let headers: Record<string, string> = {};

    let response = () => ({
      ok: ((request.status / 100) | 0) === 2, // 200-299
      statusText: request.statusText,
      status: request.status,
      url: request.responseURL,
      text: () => Promise.resolve(request.responseText),
      json: () => Promise.resolve(request.responseText).then(JSON.parse),
      // blob: () => Promise.resolve(new Blob([request.response])),
      headers: {
        keys: () => keys,
        entries: () => all,
        get: (n: string) => headers[n.toLowerCase()],
        has: (n: string) => n.toLowerCase() in headers,
      },
    });

    request.open(options.method || 'get', url, true);

    request.onload = () => {
      request
        .getAllResponseHeaders()
        .replace(
          /^(.*?):[^\S\n]*([\s\S]*?)$/gm,
          (_: string, key: string, value: string) => {
            keys.push((key = key.toLowerCase()));
            all.push([key, value]);
            headers[key] = headers[key] ? `${headers[key]},${value}` : value;
          },
        );
      resolve(response());
    };

    request.onerror = reject;

    if (options.headers) {
      for (let [key, value] of Object.entries(options.headers)) {
        request.setRequestHeader(key, value);
      }
    }

    request.send(options.body || null);
  });
}

import { URL } from 'url';

let validProtocols = new Set(['http:', 'https:']);

// Actually `curl` supports bare URLs without any protocol or port, but
// `new URL()` will not parse such strings.
export function parseUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (err) {
    return null;
  }
  let isValidProtocol = validProtocols.has(parsed.protocol);
  if (isValidProtocol) {
    return parsed;
  }
  return null;
}

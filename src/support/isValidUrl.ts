import { URL } from 'url';

let httpProtocols = new Set(['http:', 'https:']);

// Actually `curl` supports bare URLs without any protocol or port, but
// `new URL()` will not parse such strings.
export function isValidUrl(input: string, protocols = httpProtocols) {
  try {
    let url = new URL(input);
    return url.protocol ? protocols.has(url.protocol) : false;
  } catch (err) {
    return false;
  }
}

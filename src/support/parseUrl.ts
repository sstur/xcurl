const validProtocols = new Set(['http:', 'https:']);

function tryParse(url: string): URL | null {
  try {
    return new URL(url);
  } catch (err) {
    return null;
  }
}

export function parseUrl(url: string) {
  const parsed = tryParse(url) ?? tryParse('http://' + url);
  if (!parsed) {
    return null;
  }
  const isValidProtocol = validProtocols.has(parsed.protocol);
  if (isValidProtocol) {
    return parsed;
  }
  return null;
}

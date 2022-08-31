const QUOTED_VALUE = /"(\\.|[^"])*"/g;

function decode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch (e) {}
  return unescape(input);
}

function unquote(input: string): string {
  return input.slice(1, -1).replace(/\\(.)/g, '$1');
}

export function parseHeaderValue(rawHeaderValue: string | null) {
  const value = rawHeaderValue ?? '';
  const substitutions: Record<string, string> = {};
  let index = 0;
  const normalized = value.replace(QUOTED_VALUE, (original) => {
    const placeholder = `"${(index += 1)}"`;
    substitutions[placeholder] = unquote(original);
    return placeholder;
  });
  const restore = (value: string) => {
    return value.replace(QUOTED_VALUE, (placeholder) => {
      return substitutions[placeholder] ?? placeholder;
    });
  };
  const parts = normalized.split(';');
  const firstPart = parts.shift() ?? '';
  const params: Record<string, string> = {};
  for (const part of parts) {
    let [key = '', value = ''] = part.split('=');
    // Support RFC 5987 such as filename*=UTF-8''foo%c3%a4
    key = restore(key).trim().replace(/\*$/, '').toLowerCase();
    if (key.length) {
      value = restore(value).trim();
      value = value.replace(/^(UTF-8|ISO-8859-1)'(\w*)'/i, '');
      params[key] = decode(value);
    }
  }
  return [
    restore(firstPart.split('=')[0] ?? '')
      .trim()
      .toLowerCase(),
    params,
  ] as const;
}

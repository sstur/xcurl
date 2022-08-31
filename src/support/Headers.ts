export class Headers {
  private headers = new Map<string, [string, Array<string>]>();

  has(name: string) {
    return this.headers.has(name.toLowerCase());
  }

  get(name: string) {
    const value = this.headers.get(name.toLowerCase());
    return value ? value[1].join(',') : null;
  }

  set(name: string, value: string) {
    const key = name.toLowerCase();
    this.headers.set(key, [name, [value]]);
  }

  append(name: string, value: string) {
    const { headers } = this;
    const key = name.toLowerCase();
    const existing = headers.get(key);
    if (existing) {
      existing[1].push(value);
    } else {
      headers.set(key, [name, [value]]);
    }
  }

  toObject() {
    const object: { [name: string]: string | Array<string> } = {};
    for (const [name, values] of this.headers.values()) {
      object[name] = values.length > 1 ? values : values[0] ?? '';
    }
    return object;
  }

  toFlatList() {
    const list: Array<[string, string]> = [];
    for (const [name, values] of this.headers.values()) {
      list.push([name, values.join(', ')]);
    }
    return list;
  }
}

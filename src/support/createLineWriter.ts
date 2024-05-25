function toLine(text: string) {
  return text.slice(-1) === '\n' ? text : text + '\n';
}

export function createLineWriter(writeStream: NodeJS.WritableStream) {
  return async (text: string) => {
    writeStream.write(toLine(text));
  };
}

import { open as openFile } from 'fs/promises';
import type { ReadStream } from 'fs';

type FileDetails = {
  size: number;
};

export async function createReadStreamFromFile(
  filepath: string,
): Promise<[ReadStream, FileDetails]> {
  const file = await openFile(filepath, 'r');
  const stats = await file.stat();
  const readStream = file.createReadStream();
  return [readStream, { size: stats.size }];
}

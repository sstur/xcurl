import { open as openFile } from 'fs/promises';

export async function createWriteStreamFromFile(filepath: string) {
  const file = await openFile(filepath, 'w');
  return file.createWriteStream();
}

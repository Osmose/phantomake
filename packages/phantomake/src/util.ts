import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';

/** Recursively walk a directory tree and return the path of every individual file found. */
export async function walk(directory: string): Promise<string[]> {
  const fileNames = await fs.readdir(directory);
  const walkedDirectoryPromises = Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = nodePath.join(directory, fileName);
      const stat = await fs.lstat(filePath);
      if (stat.isDirectory() && !stat.isSymbolicLink()) {
        return walk(filePath);
      }

      return filePath;
    })
  );

  return (await walkedDirectoryPromises).flat();
}

import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import phantomake from '../src/index.ts';
import { walk } from '../src/util.ts';
import test from 'node:test';

export async function testInputFiles(label: string, contents: Record<string, string>) {
  test(label, async (t) => {
    const tmpDirectory = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'phantomaketest-'));
    const inputDirectory = nodePath.join(tmpDirectory, 'input');
    await fs.mkdir(inputDirectory);
    const outputDirectory = nodePath.join(tmpDirectory, 'output');
    await fs.mkdir(outputDirectory);

    for (const [filename, content] of Object.entries(contents)) {
      const inputPath = nodePath.join(inputDirectory, filename);
      await fs.mkdir(nodePath.dirname(inputPath), { recursive: true });
      await fs.writeFile(inputPath, content);
    }

    await phantomake(inputDirectory, outputDirectory);

    const outputPaths = await walk(outputDirectory);
    const outputContent: Record<string, string> = {};
    for (const outputPath of outputPaths) {
      const file = await fs.readFile(outputPath);
      outputContent[nodePath.relative(outputDirectory, outputPath)] = file.toString('utf8');
    }

    t.assert.snapshot(outputContent);
  });
}

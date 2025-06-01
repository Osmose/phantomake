import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { expect, test, describe } from 'bun:test';
import phantomake from '../src';
import { walk } from '../src/util';

export async function testInputFiles(label: string, contents: Record<string, string>) {
  test(label, async () => {
    const tmpDirectory = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'phantomaketest-'));
    const inputDirectory = nodePath.join(tmpDirectory, 'input');
    const outputDirectory = nodePath.join(tmpDirectory, 'output');

    for (const [filename, content] of Object.entries(contents)) {
      await Bun.write(nodePath.join(inputDirectory, filename), content);
    }

    await phantomake(inputDirectory, outputDirectory);

    const outputPaths = await walk(outputDirectory);
    const outputContent: Record<string, string> = {};
    for (const outputPath of outputPaths) {
      outputContent[nodePath.relative(outputDirectory, outputPath)] = await Bun.file(outputPath).text();
    }

    expect(outputContent).toMatchSnapshot();
  });
}

import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import dedent from 'dedent';
import { expect, test, describe } from 'bun:test';
import phantomake from '../src';
import { walk } from '../src/util';

async function testInputFiles(label: string, contents: Record<string, string>) {
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

describe('Markdown', () => {
  testInputFiles('Basic markdown', {
    'file.md': dedent`
      # Markdown Test file

      Testing if markdown output is correct.

      - Bulleted
      - List
    `,
    '.templates/default.ejs': `<%- output.content %>`,
  });

  testInputFiles('Include block', {
    'main.md': dedent`
      ::include{path=.markdown_include.md}

      The sum of 2 plus 2 is :include{path=.add.ejs arg1=2 arg2=2}
    `,
    '.markdown_include.md': dedent`
      # Heading

      Paragraph
    `,
    '.add.ejs': dedent`<%- Number.parseInt(arg1) + Number.parseInt(arg2) -%>`,
    '.templates/default.ejs': `<%- output.content %>`,
  });
});

describe('EJS', () => {
  testInputFiles('ctx.renderMarkdown', {
    'test.html.ejs': dedent`
      <%- await ctx.renderMarkdown("# Heading"); %>
    `,
  });
});

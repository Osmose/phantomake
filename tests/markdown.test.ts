import dedent from 'dedent';
import { describe } from 'bun:test';
import { testInputFiles } from './utils';

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

  testInputFiles('Absolute include path', {
    'main.md': dedent`
      ::include{path=/.markdown_include.md}
    `,
    '.markdown_include.md': dedent`
      # Heading

      Paragraph
    `,
    '.templates/default.ejs': `<%- output.content %>`,
  });
});

describe('EJS', () => {
  testInputFiles('ctx.renderMarkdown', {
    'test.html.ejs': dedent`
      <%- ctx.renderMarkdown("# Heading"); %>
    `,
  });
});

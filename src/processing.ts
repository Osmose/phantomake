import * as nodePath from 'node:path';
import ejs from 'ejs';
import type { InputFile, TextFileProcessor } from './base';
import { FileContext } from './context';
import renderMarkdown from './markdown';

const MarkdownProcessor: TextFileProcessor = {
  defaultAttributes: {
    template: 'default',
  },

  match(inputFile: InputFile) {
    return inputFile.parsedRelativePath.ext === '.md';
  },

  outputPath(inputFile) {
    const { dir, name } = inputFile.parsedRelativePath;
    return nodePath.join(dir, `${name}.html`);
  },

  process(inputFile: InputFile, context: FileContext) {
    if (inputFile.body === null) {
      throw new Error(`Input file ${inputFile.relativePath} is missing it's body.`);
    }
    return renderMarkdown(inputFile.body, context);
  },
};

const EJSProcessor: TextFileProcessor = {
  match(inputFile: InputFile) {
    return inputFile.parsedRelativePath.ext === '.ejs';
  },

  outputPath(inputFile) {
    const { dir, name } = inputFile.parsedRelativePath;
    return nodePath.join(dir, name); // Strip .ejs extension
  },

  process(inputFile: InputFile, context: FileContext, args?: Record<string, any>) {
    if (inputFile.body === null) {
      throw new Error(`Input file ${inputFile.relativePath} is missing it's body.`);
    }

    return ejs.render(
      inputFile.body,
      { ...args, ctx: context },
      { filename: inputFile.path, includer: context._includer, root: context._inputDirectory }
    );
  },
};

export const textFileProcessors = [MarkdownProcessor, EJSProcessor];

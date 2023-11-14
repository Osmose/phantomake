import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import ejs from 'ejs';
import frontMatter from 'front-matter';
import { micromark } from 'micromark';
import type { InputFile, FrontMatterResult } from './base';

interface TextFileProcessor {
  match(inputFile: InputFile): boolean;
  process(
    inputFile: InputFile,
    frontMatter: FrontMatterResult,
    outputDirectory: string
  ): Promise<[path: string, content: string]>;
}

const MarkdownProcessor: TextFileProcessor = {
  match(inputFile: InputFile) {
    return inputFile.parsedRelativePath.ext === '.md';
  },

  async process(inputFile: InputFile, { body }: FrontMatterResult, outputDirectory: string) {
    const { dir, name } = inputFile.parsedRelativePath;
    return [nodePath.join(outputDirectory, dir, `${name}.html`), await micromark(body, { allowDangerousHtml: true })];
  },
};

const EJSProcessor: TextFileProcessor = {
  match(inputFile: InputFile) {
    return inputFile.parsedRelativePath.ext === '.ejs';
  },

  async process(inputFile: InputFile, { body, attributes }: FrontMatterResult, outputDirectory: string) {
    const { dir, name } = inputFile.parsedRelativePath;
    return [
      nodePath.join(outputDirectory, dir, name), // Strip .ejs extension
      ejs.render(body, { page: { attributes } }, { filename: inputFile.path }),
    ];
  },
};

export const textFileProcessors = [MarkdownProcessor, EJSProcessor];

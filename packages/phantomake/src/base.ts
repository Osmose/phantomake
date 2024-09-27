import * as nodePath from 'node:path';
import { BunFile } from 'bun';
import { isText } from 'istextorbinary';
import type { FrontMatterResult as GeneralFrontMatterResult } from 'front-matter';
import { textFileProcessors } from './processing';
import frontMatter from 'front-matter';
import { FileContext } from './context';

/** Front matter attributes that are used by phantomake's processing. */
export interface FrontMatterAttributes {
  template?: string;
  [key: string]: any;
}

export type FrontMatterResult = GeneralFrontMatterResult<FrontMatterAttributes>;

/** Object that renders a text file of some kind into generated output. */
export interface TextFileProcessor {
  defaultAttributes?: Partial<FrontMatterAttributes>;
  match(inputFile: InputFile): boolean;
  outputPath(inputFile: InputFile): string;
  process(inputFile: InputFile, context: FileContext): Promise<string>;
}

/**
 * Represents a single file before it is processed by phantomake.
 */
export class InputFile {
  public readonly parsedRelativePath: nodePath.ParsedPath;

  // Properties present on text files only
  public readonly processor: TextFileProcessor | null = null;

  constructor(
    public readonly path: string,
    public readonly file: BunFile,
    public readonly relativePath: string,
    public readonly isText: boolean,

    // Provided only for text files
    public body: string | null = null,
    public attributes: FrontMatterAttributes = {}
  ) {
    this.parsedRelativePath = nodePath.parse(this.relativePath);

    if (this.isText) {
      this.processor = textFileProcessors.find((p) => p.match(this)) ?? null;
      if (this.processor) {
        this.attributes = { ...this.processor.defaultAttributes, ...this.attributes };
      }
    }
  }

  get relativeOutputPath() {
    return this.processor?.outputPath(this) ?? this.relativePath;
  }

  get url() {
    return (
      '/' +
      this.relativeOutputPath
        .replace('\\', '/')
        .replace(/^\./, '')
        .replace(/index\.html$/, '')
    );
  }

  get isTemplate() {
    return this.relativePath.startsWith('.templates');
  }

  get isWithinDotDirectory() {
    return this.relativePath.split(nodePath.sep).some((directory) => directory.startsWith('.'));
  }

  static async fromPath(inputRoot: string, path: string) {
    const relativePath = nodePath.relative(inputRoot, path);
    const isTextFile = isText(path) ?? false;
    const file = Bun.file(path);

    let body = null;
    let attributes: FrontMatterAttributes = {};
    if (isTextFile) {
      const frontMatterResult = frontMatter<FrontMatterAttributes>(await file.text());
      body = frontMatterResult.body;
      attributes = frontMatterResult.attributes;
    }

    return new InputFile(path, file, relativePath, isTextFile, body, attributes);
  }
}

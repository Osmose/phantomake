import * as fs from 'node:fs/promises';
import * as nodePath from 'node:path';
import { isText } from 'istextorbinary';
import type { FrontMatterResult as GeneralFrontMatterResult } from 'front-matter';
import { textFileProcessors } from './processing.ts';
import frontMatter from 'front-matter';
import { FileContext } from './context.ts';

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
  process(inputFile: InputFile, context: FileContext, args?: Record<string, any>): string;
}

/**
 * Represents a single file before it is processed by phantomake.
 */
export class InputFile {
  public readonly parsedRelativePath: nodePath.ParsedPath;

  // Properties present on text files only
  public readonly processor: TextFileProcessor | null = null;

  public readonly path: string;
  public readonly relativePath: string;
  public readonly isText: boolean;

  // Provided only for text files
  public body: string | null = null;
  public attributes: FrontMatterAttributes = {};

  constructor(
    path: string,
    relativePath: string,
    isText: boolean,
    body: string | null = null,
    attributes: FrontMatterAttributes = {},
  ) {
    this.path = path;
    this.relativePath = relativePath;
    this.isText = isText;
    this.body = body;
    this.attributes = attributes;

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
        .replaceAll('\\', '/')
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

    let body = null;
    let attributes: FrontMatterAttributes = {};
    if (isTextFile) {
      const fileText = await fs.readFile(path);
      const frontMatterResult = frontMatter<FrontMatterAttributes>(fileText.toString('utf8'));
      body = frontMatterResult.body;
      attributes = frontMatterResult.attributes;
    }

    return new InputFile(path, relativePath, isTextFile, body, attributes);
  }
}

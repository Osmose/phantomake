import * as nodePath from 'node:path';
import { BunFile } from 'bun';
import { isText } from 'istextorbinary';
import type { FrontMatterResult as GeneralFrontMatterResult } from 'front-matter';

/** Front matter attributes that are used by phantomake's processing. */
export interface FrontMatterAttributes {
  template?: string;
  [key: string]: any;
}

export type FrontMatterResult = GeneralFrontMatterResult<FrontMatterAttributes>;

/**
 * Represents a single file before it is processed by phantomake.
 *
 * Specifically, InputFile instances should not trigger a file read upon creation.
 */
export class InputFile {
  public readonly relativePath: string;
  public readonly parsedRelativePath: nodePath.ParsedPath;
  public readonly file: BunFile;
  public readonly isText: boolean;

  constructor(private inputRoot: string, public readonly path: string) {
    this.relativePath = nodePath.relative(inputRoot, path);
    this.parsedRelativePath = nodePath.parse(this.relativePath);
    this.file = Bun.file(path); // BunFiles are lazy
    this.isText = isText(this.path) ?? false;
  }

  get isTemplate() {
    return this.relativePath.startsWith('.templates');
  }

  get isWithinDotDirectory() {
    return this.relativePath.split(nodePath.sep).some((directory) => directory.startsWith('.'));
  }
}

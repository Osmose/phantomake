import * as nodePath from 'node:path';
import * as fs from 'node:fs';
import type { InputFile } from './base';
import dayjs from 'dayjs';
import { globSync } from 'glob';
import _ from 'lodash';
import renderMarkdown from './markdown';
import { DepGraph } from 'dependency-graph';

interface GlobalContextOptions {
  baseUrl?: string;
}

/** Stores data shared by all FileContexts and creates them for each individual file. */
export class GlobalContext {
  public readonly inputFileMap: Record<string, InputFile> = {};
  public readonly paginators: Record<string, Paginator<any>> = {};
  public readonly dependencyGraph: DepGraph<string> = new DepGraph();
  public readonly alwaysBuildFiles: Set<string> = new Set();
  private fileContexts: Record<string, FileContext> = {};

  constructor(
    public readonly inputDirectory: string,
    inputFiles: InputFile[],
    public readonly options: GlobalContextOptions = {}
  ) {
    for (const inputFile of inputFiles) {
      this.inputFileMap[inputFile.path] = inputFile;
      this.dependencyGraph.addNode(inputFile.relativePath);
    }
  }

  addDependency(inputFile: InputFile, dependencyInputFile: InputFile) {
    if (!this.dependencyGraph.hasNode(inputFile.relativePath)) {
      this.dependencyGraph.addNode(inputFile.relativePath);
    }
    this.dependencyGraph.addDependency(inputFile.relativePath, dependencyInputFile.relativePath);
  }

  fileContext(inputFile: InputFile) {
    let fileContext = this.fileContexts[inputFile.path];
    if (!fileContext) {
      fileContext = new FileContext(this, inputFile);
      this.fileContexts[inputFile.path] = fileContext;
    }

    return fileContext;
  }
}

interface PaginatorConfig {
  itemsPerPage: number;
}

interface GetFilesOptions {
  sort?: {
    attribute: string;
    order?: 'asc' | 'desc';
    type?: 'string' | 'date';
  };
}

/** Contains data about the file currently being rendered, as well as utility functions for EJS. */
export class FileContext {
  constructor(private globalCtx: GlobalContext, public readonly file: InputFile) {
    // Bind so that we can pass this as around as a function argument
    this._includer = this._includer.bind(this);
  }

  getFiles(pattern: string, options: GetFilesOptions = {}) {
    const paths = globSync(pattern, { cwd: nodePath.dirname(this.file.path), absolute: true });
    let files = paths.map((path) => this.globalCtx.inputFileMap[path]).filter((file) => file);

    if (options.sort) {
      const sortOptions = options.sort;
      files = _.sortBy(files, (file) => {
        const attribute = file.attributes[sortOptions.attribute];
        if (sortOptions.type === 'date') {
          return dayjs(attribute);
        }
        return attribute;
      });

      if (sortOptions.order === 'desc') {
        files.reverse();
      }
    }

    // Add to dependencies list
    for (const file of files) {
      this.globalCtx.addDependency(this.file, file);
    }

    // Files that use globs are marked as always needing a rebuild in case new
    // files are added that might affect their content.
    this.globalCtx.alwaysBuildFiles.add(this.file.relativePath);

    return files;
  }

  /** Passed as the includer option to EJS so we can capture included dependencies. */
  _includer(originalPath: string, parsedPath: string) {
    const inputFile = this.globalCtx.inputFileMap[parsedPath];
    if (inputFile) {
      this.globalCtx.addDependency(this.file, inputFile);
    }

    return { filename: parsedPath };
  }

  /** Input directory passed to phantomake(), used for EJS to set the root path for absolute includes. */
  get _inputDirectory() {
    return this.globalCtx.inputDirectory;
  }

  /** Used by the Markdown processor for the `include` directive. */
  _include(path: string, args: Record<string, any>) {
    const matchedPaths = globSync(path, { cwd: nodePath.dirname(this.file.path), absolute: true });
    if (matchedPaths.length > 1) {
      throw new Error(`Included file path "${path}" matches more than one file.`);
    } else if (matchedPaths.length < 1) {
      throw new Error(`Included file path "${path}" could not be found.`);
    }

    const inputFile = this.globalCtx.inputFileMap[path];
    if (!inputFile) {
      throw new Error(`Included file "${path}" must be within the source directory passed to phantomake.`);
    } else if (!inputFile.isText) {
      throw new Error(`Included file "${path}" must be a text file.`);
    }

    if (inputFile.processor) {
      return inputFile.processor.process(inputFile, this, args);
    }

    return inputFile.body ?? '';
  }

  paginate<T>(items: T[], config?: Partial<PaginatorConfig>) {
    if (this.file.isTemplate) {
      // TODO: Fix issue with templates associating a paginator with the source file and not the template.
      throw new Error('Cannot paginate in templates');
    }

    const path = this.file.path;
    let paginator = this.globalCtx.paginators[path];
    if (!paginator) {
      paginator = new Paginator<T>(this.file, items, config);
      this.globalCtx.paginators[path] = paginator;
    }

    return paginator;
  }

  renderMarkdown(content: string) {
    return renderMarkdown(content);
  }

  formatDate(date: string | number | Date, template?: string) {
    return dayjs(date).format(template);
  }

  absolutify(url: string) {
    const { baseUrl } = this.globalCtx.options;
    if (!baseUrl) {
      throw new Error('Cannot use absolutify without providing a base-url: See the --base-url option for details.');
    }

    const urlObject = new URL(url, `${baseUrl}${this.file.url}`);
    return urlObject.href;
  }

  readJson(path: string) {
    const resolvedPath = nodePath.resolve(this.file.path, '..', path);

    // Store dependency
    const jsonInputFile = this.globalCtx.inputFileMap[resolvedPath];
    if (jsonInputFile) {
      this.globalCtx.addDependency(this.file, jsonInputFile);
    }

    const file = fs.readFileSync(resolvedPath, { encoding: 'utf-8' });
    return JSON.parse(file);
  }

  now() {
    return new Date();
  }

  currentUrl(absolute = false) {
    if (absolute) {
      return this.absolutify(this.file.url);
    }

    return this.file.url;
  }

  tagUri(uri: string, date: Date) {
    const url = new URL(uri);
    if (!date) {
      throw new Error('tagUri must be passed a valid date object as the second argument.');
    }

    return `tag:${url.host},${dayjs(date).format('YYYY-MM-DD')}:${url.pathname}${
      url.hash.length > 1 ? '/' + url.hash.substring(1) : ''
    }`;
  }
}

interface Page {
  url: string;
  outputPath: string;
  number: number;
}

class Paginator<T> {
  public readonly config: PaginatorConfig;
  public readonly pages: Page[];
  private _currentPage = 1; // 1-indexed page number

  constructor(private inputFile: InputFile, private readonly allItems: T[], config: Partial<PaginatorConfig> = {}) {
    this.config = {
      itemsPerPage: 5,
      ...config,
    };
    this.pages = [];

    const { name, ext, dir } = nodePath.parse(this.inputFile.relativeOutputPath);
    const prefix = name === 'index' ? '' : name; // index.* files don't use index as the prefix

    for (let k = 0; k < allItems.length; k += this.config.itemsPerPage) {
      const pageNumber = this.pages.length + 1;
      const outputPath = nodePath.join(dir, `${prefix}${pageNumber}${ext}`);
      this.pages.push({
        number: pageNumber,
        url: '/' + outputPath.replace(nodePath.sep, '/').replace(/^[\.\/]/, ''),
        outputPath,
      });
    }
  }

  set currentPage(page: number) {
    if (page < 1 || page > this.pages.length) {
      throw new Error(`Invalid page ${page}; the current page must be between 1-${this.pages.length}`);
    }

    this._currentPage = page;
  }

  get currentPage() {
    return this._currentPage;
  }

  get items() {
    const { itemsPerPage } = this.config;
    const start = (this.currentPage - 1) * itemsPerPage;
    return this.allItems.slice(start, start + itemsPerPage);
  }
}

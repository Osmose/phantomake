import * as nodePath from 'node:path';
import * as fs from 'node:fs';
import type { InputFile } from './base';
import dayjs from 'dayjs';
import { globSync } from 'glob';
import _ from 'lodash';
import renderMarkdown from './markdown';

interface GlobalContextOptions {
  baseUrl?: string;
}

/** Stores data shared by all FileContexts and creates them for each individual file. */
export class GlobalContext {
  public readonly inputFileMap: Record<string, InputFile> = {};
  public readonly paginators: Record<string, Paginator<any>> = {};
  private fileContexts: Record<string, FileContext> = {};

  constructor(inputFiles: InputFile[], public readonly options: GlobalContextOptions = {}) {
    for (const inputFile of inputFiles) {
      this.inputFileMap[inputFile.path] = inputFile;
    }
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
  constructor(private globalCtx: GlobalContext, public readonly file: InputFile) {}

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

    return files;
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

  formatDate(dateString: string, template: string) {
    return dayjs(dateString).format(template);
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
    const file = fs.readFileSync(nodePath.resolve(this.file.path, '..', path), { encoding: 'utf-8' });
    return JSON.parse(file);
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

  relativeOutputPathForPage(pageNumber: number) {
    return;
  }
}

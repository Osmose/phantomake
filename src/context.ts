import * as nodePath from 'node:path';
import type { InputFile } from './base';
import dayjs from 'dayjs';
import { globSync } from 'glob';
import renderMarkdown from './markdown';

/** Stores data shared by all FileContexts and creates them for each individual file. */
export class GlobalContext {
  public readonly inputFileMap: Record<string, InputFile> = {};
  public readonly paginators: Record<string, Paginator<any>> = {};
  private fileContexts: Record<string, FileContext> = {};

  constructor(inputFiles: InputFile[]) {
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

/** Data and utility functions used by processors. */
export class FileContext {
  constructor(private globalCtx: GlobalContext, public readonly inputFile: InputFile) {}

  getFiles(pattern: string) {
    const paths = globSync(pattern, { cwd: nodePath.dirname(this.inputFile.path), absolute: true });
    return paths.map((path) => this.globalCtx.inputFileMap[path]).filter((file) => file);
  }

  paginate<T>(items: T[], config?: Partial<PaginatorConfig>) {
    if (this.inputFile.isTemplate) {
      // TODO: Fix issue with templates associating a paginator with the source file and not the template.
      throw new Error('Cannot paginate in templates');
    }

    const path = this.inputFile.path;
    let paginator = this.globalCtx.paginators[path];
    if (!paginator) {
      paginator = new Paginator<T>(this.inputFile, items, config);
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

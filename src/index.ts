import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import ejs from 'ejs';
import { consola } from 'consola';
import { InputFile } from './base';
import { FileContext, GlobalContext } from './context';
import { walk } from './util';

interface Template {
  render: ejs.TemplateFunction;
  context: FileContext;
}

class Templates {
  constructor(private readonly templates: { [name: string]: Template }) {}

  apply(templateName: string | null | undefined, data?: ejs.Data | undefined) {
    const template = this.templates[templateName ?? 'default'];
    if (!template) {
      if (!templateName || templateName === 'default') {
        throw new Error(
          'Markdown files without an explicit template require a default HTML template at .templates/default.ejs'
        );
      } else {
        throw new Error(`No template found under .templates named ${templateName}.`);
      }
    }

    return template.render({ ...data, ctx: template.context });
  }

  contextFor(templateName: string) {
    return this.templates[templateName].context;
  }

  static async fromInputFiles(globalContext: GlobalContext, inputFiles: InputFile[]) {
    const templates: { [name: string]: Template } = {};
    for (const inputFile of inputFiles) {
      if (!inputFile.isTemplate) {
        continue;
      }

      const context = globalContext.fileContext(inputFile);
      templates[inputFile.parsedRelativePath.name] = {
        render: ejs.compile(await inputFile.file.text(), {
          filename: inputFile.path,
          includer: context._includer,
        }),
        context,
      };
    }

    return new Templates(templates);
  }
}

interface Output {
  content: string;
  file: InputFile;
  path: string;
}

function renderOutput(inputFile: InputFile, globalContext: GlobalContext, templates: Templates): Output {
  const output = {
    content: inputFile.body ?? '',
    file: inputFile,
    path: inputFile.relativePath,
  };
  const context = globalContext.fileContext(inputFile);

  // Apply the matching processor if one was found
  if (inputFile.processor) {
    output.path = inputFile.processor.outputPath(inputFile);
    output.content = inputFile.processor.process(inputFile, context);
  }

  // If a template was defined in the frontmatter, apply the processed content to it
  const attributes = inputFile.attributes;
  if (attributes.template) {
    output.content = templates.apply(attributes.template, { ctx: context, output });

    // Add template to the input file's dependencies
    const templateInputFile = templates.contextFor(attributes.template).file;
    globalContext.addDependency(inputFile, templateInputFile);
  }

  return output;
}

export interface PhantomakeOptions {
  logging?: boolean;

  /** URL / domain name to be prepended to absolute URLs. */
  baseUrl?: string;

  /** Only build input files that match the given file paths. */
  matchFiles?: string[];
}

export default async function phantomake(
  inputDirectory: string,
  outputDirectory: string,
  options: PhantomakeOptions = {}
) {
  const logger = options.logging ? consola : null;

  // Find input files and prepare for processing
  const inputPaths = await walk(inputDirectory);
  const inputFiles: InputFile[] = [];
  for (const path of inputPaths) {
    inputFiles.push(await InputFile.fromPath(inputDirectory, path));
  }
  const globalContext = new GlobalContext(inputDirectory, inputFiles, { baseUrl: options.baseUrl });
  const templates = await Templates.fromInputFiles(globalContext, inputFiles);

  // Process input files into output
  const tempOutputDirectory = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'phantomake-'));
  for (const inputFile of inputFiles) {
    // Dot directories / dotfiles are not processed
    if (inputFile.parsedRelativePath.name.startsWith('.') || inputFile.isWithinDotDirectory) {
      continue;
    }

    // If matchFiles is specified, only process input files that match the given paths
    if (options.matchFiles) {
      const matchingPath = options.matchFiles.find((filePath) => inputFile.relativePath === filePath);
      if (!matchingPath) {
        continue;
      }
    }

    if (inputFile.isText) {
      const outputs = [renderOutput(inputFile, globalContext, templates)];

      // If a paginator was created, we have to output multiple files
      const paginator = globalContext.paginators[inputFile.path];
      if (paginator) {
        for (const page of paginator.pages) {
          paginator.currentPage = page.number;
          const output = renderOutput(inputFile, globalContext, templates);
          output.path = page.outputPath;
          outputs.push(output);
        }
      }

      if (outputs.length === 1) {
        logger?.verbose(`${inputFile.relativePath} ──> ${outputs[0].path}`);
      } else {
        logger?.verbose(inputFile.relativePath);
        for (const output of outputs) {
          logger?.verbose(` └─> ${output.path}`);
        }
      }

      // Write the final outputs
      for (const output of outputs) {
        const fullOutputPath = nodePath.join(tempOutputDirectory, output.path);
        await fs.mkdir(nodePath.dirname(fullOutputPath), { recursive: true });
        await Bun.write(fullOutputPath, output.content);
      }
    } else {
      // Non-text files are copied
      logger?.verbose(`${inputFile.relativePath} ──> ${inputFile.relativePath}`);
      const outputPath = nodePath.join(tempOutputDirectory, inputFile.relativePath);
      await fs.mkdir(nodePath.dirname(outputPath), { recursive: true });
      await Bun.write(outputPath, inputFile.file);
    }
  }

  // Write output
  await fs.cp(tempOutputDirectory, outputDirectory, { recursive: true });

  // TODO: Maybe return a more sane result rather than just returning the global context
  return globalContext;
}

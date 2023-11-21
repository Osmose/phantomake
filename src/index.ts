import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import ejs from 'ejs';
import frontMatter from 'front-matter';
import { FrontMatterAttributes, InputFile } from './base';
import { textFileProcessors } from './processing';
import { FileContext, GlobalContext } from './context';

/** Recursively walk a directory tree and return the path of every individual file found. */
async function walk(directory: string): Promise<string[]> {
  const fileNames = await fs.readdir(directory);
  const walkedDirectoryPromises = Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = nodePath.join(directory, fileName);
      const stat = await fs.lstat(filePath);
      if (stat.isDirectory() && !stat.isSymbolicLink()) {
        return walk(filePath);
      }

      return filePath;
    })
  );

  return (await walkedDirectoryPromises).flat();
}

interface Template {
  render: ejs.TemplateFunction;
  context: FileContext;
}

class Templates {
  constructor(private readonly templates: { [name: string]: Template }) {}

  apply(templateName: string | null | undefined, data?: ejs.Data | undefined) {
    const template = this.templates[templateName ?? 'default'];
    if (!template) {
      if (!templateName) {
        throw new Error(
          'Markdown files without an explicit template require a default HTML template at .templates/default.ejs'
        );
      } else {
        throw new Error(`No template found under .templates named ${templateName}.`);
      }
    }

    return template.render({ ...data, ctx: template.context });
  }

  static async fromInputFiles(globalContext: GlobalContext, inputFiles: InputFile[]) {
    const templates: { [name: string]: Template } = {};
    for (const inputFile of inputFiles) {
      if (!inputFile.isTemplate) {
        continue;
      }

      templates[inputFile.parsedRelativePath.name] = {
        render: ejs.compile(await inputFile.file.text(), {
          filename: inputFile.path,
        }),
        context: globalContext.fileContext(inputFile),
      };
    }

    return new Templates(templates);
  }
}

interface Output {
  content: string;
  attributes: FrontMatterAttributes;
  path: string;
}

async function renderOutput(
  inputFile: InputFile,
  outputDirectory: string,
  globalContext: GlobalContext,
  templates: Templates
): Promise<Output> {
  const output = {
    content: inputFile.body ?? '',
    attributes: inputFile.attributes,
    path: nodePath.join(outputDirectory, inputFile.relativePath),
  };
  const context = globalContext.fileContext(inputFile);

  // Apply the matching processor if one was found
  if (inputFile.processor) {
    output.path = nodePath.join(outputDirectory, inputFile.processor.outputPath(inputFile));
    output.content = await inputFile.processor.process(inputFile, context);
  }

  // If a template was defined in the frontmatter, apply the processed content to it
  const attributes = inputFile.attributes;
  if (attributes.template) {
    output.content = templates.apply(attributes.template, { ctx: context, output });
  }

  return output;
}

export default async function phantomake(inputDirectory: string, outputDirectory: string) {
  // Find input files and prepare for processing
  const inputPaths = await walk(inputDirectory);
  const inputFiles: InputFile[] = [];
  for (const path of inputPaths) {
    inputFiles.push(await InputFile.fromPath(inputDirectory, path));
  }
  const globalContext = new GlobalContext(inputFiles);
  const templates = await Templates.fromInputFiles(globalContext, inputFiles);

  // Process input files into output
  const tempOutputDirectory = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'phantomake-'));
  for (const inputFile of inputFiles) {
    // Dot directories are not processed
    if (inputFile.isWithinDotDirectory) {
      continue;
    }

    console.log(`Processing ${inputFile.relativePath}...`);

    if (inputFile.isText) {
      const outputs = [await renderOutput(inputFile, tempOutputDirectory, globalContext, templates)];

      // If a paginator was created, we have to output multiple files
      const paginator = globalContext.paginators[inputFile.path];
      if (paginator) {
        for (const page of paginator.pages) {
          paginator.currentPage = page.number;
          const output = await renderOutput(inputFile, tempOutputDirectory, globalContext, templates);
          output.path = nodePath.join(tempOutputDirectory, page.outputPath);
          outputs.push(output);
        }
      }

      // Write the final outputs
      for (const output of outputs) {
        console.log(`Writing output to ${output.path}...`);
        await fs.mkdir(nodePath.dirname(output.path), { recursive: true });
        await Bun.write(output.path, output.content);
      }
    } else {
      // Non-text files are copied
      const outputPath = nodePath.join(tempOutputDirectory, inputFile.relativePath);
      await fs.mkdir(nodePath.dirname(outputPath), { recursive: true });
      await Bun.write(outputPath, inputFile.file);
    }
  }

  // Write output
  await fs.cp(tempOutputDirectory, outputDirectory, { recursive: true });
}

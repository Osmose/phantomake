import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import ejs from 'ejs';
import frontMatter from 'front-matter';
import { micromark } from 'micromark';
import { FrontMatterAttributes, InputFile } from './base';
import { textFileProcessors } from './processors';

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

class Templates {
  constructor(private readonly templates: { [name: string]: ejs.TemplateFunction }) {}

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

    return template(data);
  }

  static async fromInputFiles(inputFiles: InputFile[]) {
    const templates: { [name: string]: ejs.TemplateFunction } = {};
    for (const inputFile of inputFiles) {
      if (!inputFile.isTemplate) {
        continue;
      }

      templates[inputFile.parsedRelativePath.name] = ejs.compile(await inputFile.file.text(), {
        filename: inputFile.path,
      });
    }

    return new Templates(templates);
  }
}

export default async function phantomake(inputDirectory: string, outputDirectory: string) {
  // Find input files and prepare for processing
  const inputFiles = (await walk(inputDirectory)).map((inputPath) => new InputFile(inputDirectory, inputPath));
  const templates = await Templates.fromInputFiles(inputFiles);

  // Process input files into output
  const tempOutputDirectory = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'phantomake-'));
  for (const inputFile of inputFiles) {
    // Dot directories are not processed
    if (inputFile.isWithinDotDirectory) {
      continue;
    }

    console.log(`Processing ${inputFile.relativePath}...`);

    if (inputFile.isText) {
      // Text files may optionally have front matter
      const frontMatterResult = frontMatter<FrontMatterAttributes>(await inputFile.file.text());
      const { attributes, body } = frontMatterResult;

      let output = body;
      let outputPath = nodePath.join(tempOutputDirectory, inputFile.relativePath);

      // Apply the matching processor if one was found
      const processor = textFileProcessors.find((p) => p.match(inputFile));
      if (processor) {
        [outputPath, output] = await processor.process(inputFile, frontMatterResult, tempOutputDirectory);
      }

      // If a template was defined in the frontmatter, apply the processed content to it
      if (attributes.template) {
        output = templates.apply(attributes.template, { page: { attributes, content: output } });
      }

      // Write the final output
      await fs.mkdir(nodePath.dirname(outputPath), { recursive: true });
      await Bun.write(outputPath, output);
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

import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { BunFile } from 'bun';
import ejs from 'ejs';
import frontMatter from 'front-matter';
import { micromark } from 'micromark';

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
          'Markdown files without an explicit template require a default HTML template at .templates/default.html'
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

interface FrontMatterAttributes {
  template?: string;
  [key: string]: any;
}

class InputFile {
  public readonly relativePath: string;
  public readonly parsedRelativePath: nodePath.ParsedPath;
  public readonly file: BunFile;

  constructor(private inputRoot: string, public readonly path: string) {
    this.relativePath = nodePath.relative(inputRoot, path);
    this.parsedRelativePath = nodePath.parse(this.relativePath);
    this.file = Bun.file(path);
  }

  get isTemplate() {
    return this.relativePath.startsWith('.templates');
  }

  get isWithinDotDirectory() {
    return this.relativePath.split(nodePath.sep).some((directory) => directory.startsWith('.'));
  }

  outputPath(outputDir: string, extension: string) {
    return nodePath.join(outputDir, this.parsedRelativePath.dir, `${this.parsedRelativePath.name}${extension}`);
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

    if (inputFile.parsedRelativePath.ext === '.md') {
      // Markdown compiled and rendered with an EJS template
      const { attributes, body } = frontMatter<FrontMatterAttributes>(await inputFile.file.text());
      const content = await micromark(body, { allowDangerousHtml: true });

      const output = templates.apply(attributes.template, { page: { attributes, content } });
      await Bun.write(inputFile.outputPath(tempOutputDirectory, '.html'), output);
    } else if (['.html', '.ejs'].includes(inputFile.parsedRelativePath.ext)) {
      // EJS template (or bare HTML)
      const { attributes, body } = frontMatter<FrontMatterAttributes>(await inputFile.file.text());
      const content = ejs.render(body, { page: { attributes } }, { filename: inputFile.path });

      const output = templates.apply(attributes.template, { page: { attributes, content } });
      await Bun.write(inputFile.outputPath(tempOutputDirectory, '.html'), output);
    } else {
      // Everything else is just copied over
      const outputPath = nodePath.join(tempOutputDirectory, inputFile.relativePath);
      await Bun.write(outputPath, inputFile.file);
    }
  }

  // Write output
  await fs.cp(tempOutputDirectory, outputDirectory, { recursive: true });
}

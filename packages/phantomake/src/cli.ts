#!/usr/bin/env bun
import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as http from 'node:http';
import { program } from 'commander';
import finalhandler from 'finalhandler';
import serveStatic from 'serve-static';
import chokidar from 'chokidar';
import send from 'send';
import toml from 'toml';
import consola from 'consola';
import { DepGraph } from 'dependency-graph';

import phantomake, { PhantomakeOptions } from './index';

interface CommonOptions {
  baseUrl?: string;
  verbose: boolean;
}

program
  .name('phantomake')
  .version('0.1')
  .description('A file-focused static site generator')
  .option('--base-url <url>', 'Base URL to use for absolute URLs')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .hook('preAction', (thisCommand) => {
    consola.level = 4; // Info
    if (thisCommand.opts().verbose) {
      consola.level = Number.POSITIVE_INFINITY;
    }
  });

async function makePhantomakeOptions(
  inputDirectory: string | null,
  options?: Partial<PhantomakeOptions>
): Promise<PhantomakeOptions> {
  const programOptions: CommonOptions = program.opts();

  let projectConfig = {};
  if (inputDirectory) {
    const configFile = Bun.file(nodePath.join(inputDirectory, '.phantomake.toml'));
    if (await configFile.exists()) {
      projectConfig = toml.parse(await configFile.text());
    }
  }

  return {
    baseUrl: programOptions.baseUrl,
    ...projectConfig,
    ...options,
  };
}

function replaceNode(dependencyGraph: DepGraph<string>, node: string, dependencies: string[]) {
  // Remove existing dependencies
  if (dependencyGraph.hasNode(node)) {
    for (const existingDependency of dependencyGraph.directDependenciesOf(node)) {
      dependencyGraph.removeDependency(node, existingDependency);
    }
  } else {
    dependencyGraph.addNode(node);
  }

  // Add new ones
  for (const dependency of dependencies) {
    dependencyGraph.addDependency(node, dependency);
  }
}

program
  .command('build', { isDefault: true })
  .description('Build a directory and save the output')
  .argument('<inputDirectory>', 'Directory containing source files')
  .argument('<outputDirectory>', "Directory to write generated site to. Will be created if it doesn't exist.")
  .action(async (inputDirectory: string, outputDirectory: string) => {
    phantomake(
      nodePath.resolve(inputDirectory),
      nodePath.resolve(outputDirectory),
      await makePhantomakeOptions(inputDirectory, { logging: true })
    );
  });

interface WatchOptions extends CommonOptions {
  port: string;
  host: string;
}

program
  .command('watch')
  .description('Build and watch a directory for changes, and host the output on a local development server')
  .argument('<inputDirectory>', 'Directory containing source files')
  .option('-p, --port <port>', 'Port to listen on', '8000')
  .option('-h, --host <host>', 'Hostname to listen on', 'localhost')
  .action(async (inputDirectory: string, options: WatchOptions) => {
    const watchDirectory = nodePath.resolve(inputDirectory);
    const tempOutputDirectory = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'phantomake-'));
    const phantomakeOptions = await makePhantomakeOptions(inputDirectory, {
      logging: true,
      baseUrl: `http://${options.host}:${options.port}`,
    });

    let dependencyGraph: DepGraph<string>;
    consola.start(`Performing initial build of ${watchDirectory}`);
    try {
      dependencyGraph = (await phantomake(watchDirectory, tempOutputDirectory, phantomakeOptions)).dependencyGraph;
      consola.success('Build succeeded');
    } catch (err) {
      consola.error(err?.toString());
      return;
    }

    // Only run one make call at a time; if a change happens during a run, finish the current one and schedule
    // a re-run when it finishes.
    let makePromise: Promise<void> | null = null;
    let pendingChangedFiles: string[] = [];
    function runPhantomake(changedFiles: string[]) {
      if (makePromise) {
        pendingChangedFiles = pendingChangedFiles.concat(changedFiles);
      } else {
        const matchFiles = changedFiles.flatMap((relativeFilePath) => {
          // Include files that depend on changed files in build
          let changed = [relativeFilePath];
          if (dependencyGraph.hasNode(relativeFilePath)) {
            changed = changed.concat(dependencyGraph.dependantsOf(relativeFilePath));
          }
          return changed;
        });
        consola.verbose(`Rebuilding files: \n  ${matchFiles.join('\n  ')}`);

        makePromise = phantomake(watchDirectory, tempOutputDirectory, {
          ...phantomakeOptions,
          matchFiles,
        })
          .then(
            (globalContext) => {
              consola.success('Build succeeded');

              // Update dependencies only for files that actually got rendered
              for (const fileName of matchFiles) {
                let newDependencies: string[] = [];
                if (globalContext.dependencyGraph.hasNode(fileName)) {
                  newDependencies = globalContext.dependencyGraph.directDependenciesOf(fileName);
                }
                replaceNode(dependencyGraph, fileName, newDependencies);
              }
            },
            (err) => {
              consola.error(err?.toString());
            }
          )
          .finally(() => {
            makePromise = null;
            if (pendingChangedFiles.length > 0) {
              const rerunChangedFiles = pendingChangedFiles;
              pendingChangedFiles = [];
              runPhantomake(rerunChangedFiles);
            }
          });
      }
    }

    const watcher = chokidar.watch(watchDirectory);
    watcher.on('ready', () => {
      watcher.on('all', async (event, filename) => {
        const relativeFilename = nodePath.relative(watchDirectory, filename);
        consola.log(`Detected ${event} in ${relativeFilename}, rebuilding`);
        runPhantomake([relativeFilename]);
      });
    });

    const serve = serveStatic(tempOutputDirectory);
    const server = http.createServer((req, res) => {
      const done = finalhandler(req as http.IncomingMessage, res as http.ServerResponse, {});
      serve(req as http.IncomingMessage, res as http.ServerResponse, (err) => {
        if (!err) {
          res.statusCode = 404;
          send(req, nodePath.join(tempOutputDirectory, '404.html')).pipe(res);
        } else {
          done(err);
        }
      });
    });
    server.listen(Number.parseInt(options.port), options.host);
    consola.start(`Now serving project at http://${options.host}:${options.port}`);

    process.on('SIGINT', async () => {
      // close watcher when Ctrl-C is pressed
      consola.log('Closing watcher');
      watcher.close();
      server.close(() => process.exit(0));
    });
  });

program.parse();

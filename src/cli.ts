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

import phantomake, { PhantomakeOptions } from './index';

program.name('phantomake').version('0.1').option('--base-url <url>', 'Base URL to use for absolute URLs');

async function makePhantomakeOptions(
  inputDirectory: string | null,
  options?: Partial<PhantomakeOptions>
): Promise<PhantomakeOptions> {
  const programOptions = program.opts();

  let projectConfig = {};
  if (inputDirectory) {
    const configText = await Bun.file(nodePath.join(inputDirectory, '.phantomake.toml')).text();
    if (configText) {
      projectConfig = toml.parse(configText);
    }
  }

  return {
    baseUrl: programOptions.baseUrl,
    ...projectConfig,
    ...options,
  };
}

program
  .command('build', { isDefault: true })
  .argument('<inputDirectory>', 'Directory containing source files')
  .argument('<outputDirectory>', "Directory to write generate site to. Will be created if it doesn't exist.")
  .action(async (inputDirectory: string, outputDirectory: string) => {
    phantomake(
      nodePath.resolve(inputDirectory),
      nodePath.resolve(outputDirectory),
      await makePhantomakeOptions(inputDirectory, { logging: true })
    );
  });

program
  .command('watch')
  .argument('<inputDirectory>', 'Directory containing source files')
  .action(async (inputDirectory: string) => {
    const watchDirectory = nodePath.resolve(inputDirectory);
    const tempOutputDirectory = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'phantomake-'));
    const phantomakeOptions = await makePhantomakeOptions(inputDirectory, {
      baseUrl: 'http://localhost:8000',
    });

    console.log(`Building...`);
    try {
      await phantomake(watchDirectory, tempOutputDirectory, phantomakeOptions);
    } catch (err) {
      console.error(err?.toString());
    }

    // Only run one make call at a time; if a change happens during a run, finish the current one and schedule
    // a re-run when it finishes.
    let makePromise: Promise<void> | null = null;
    let remakeAfterFinish = false;
    function runPhantomake() {
      if (makePromise) {
        remakeAfterFinish = true;
      } else {
        makePromise = phantomake(watchDirectory, tempOutputDirectory, phantomakeOptions).finally(() => {
          makePromise = null;
          if (remakeAfterFinish) {
            remakeAfterFinish = false;
            runPhantomake();
          }
        });
      }
    }

    const watcher = chokidar.watch(watchDirectory);
    watcher.on('ready', () => {
      watcher.on('all', async (event, filename) => {
        console.log(`Detected ${event} in ${filename}, rebuilding...`);
        runPhantomake();
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
    server.listen(8000, '0.0.0.0');
    console.log(`Now serving project at http://localhost:8000`);

    process.on('SIGINT', async () => {
      // close watcher when Ctrl-C is pressed
      console.log('Closing watcher...');
      watcher.close();
      server.close(() => process.exit(0));
    });
  });

program.parse();

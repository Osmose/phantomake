import * as nodePath from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { watch } from 'node:fs';
import { program } from 'commander';
import { createServer } from 'http-server';
import chokidar from 'chokidar';
import phantomake from './index';

program.name('phantomake').version('0.1');

program
  .command('build', { isDefault: true })
  .argument('<inputDirectory>', 'Directory containing source files')
  .argument('<outputDirectory>', "Directory to write generate site to. Will be created if it doesn't exist.")
  .action((inputDirectory: string, outputDirectory: string) => {
    phantomake(nodePath.resolve(inputDirectory), nodePath.resolve(outputDirectory));
  });

program
  .command('watch')
  .argument('<inputDirectory>', 'Directory containing source files')
  .action(async (inputDirectory: string) => {
    const watchDirectory = nodePath.resolve(inputDirectory);
    const tempOutputDirectory = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'phantomake-'));

    console.log(`Building...`);
    await phantomake(watchDirectory, tempOutputDirectory);

    const watcher = chokidar.watch(watchDirectory, {
      followSymlinks: false,
      depth: 30,
    });
    watcher.on('ready', () => {
      watcher.on('all', (eventName, path) => {
        console.log(`Detected change in ${path}, rebuilding...`);
        phantomake(watchDirectory, tempOutputDirectory);
      });
    });

    const server = createServer({
      root: tempOutputDirectory,
      cache: -1,
      showDir: false,
    });
    server.listen(8000, '0.0.0.0');
    console.log(`Now serving project at http://localhost:8000`);

    process.on('SIGINT', async () => {
      // close watcher when Ctrl-C is pressed
      console.log('Closing watcher...');
      await watcher.close();
      server.close(() => process.exit(0));
    });
  });

program.parse();

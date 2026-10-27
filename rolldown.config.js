import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/cli.ts',
  platform: 'node',
  external: ['fsevents'],
  output: {
    codeSplitting: false,
    format: 'cjs',
    file: 'dist/phantomake.cjs',
  },
});

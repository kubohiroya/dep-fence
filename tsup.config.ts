import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    conditions: 'src/conditions.ts',
  },
  format: ['esm'],
  dts: { entry: { index: 'src/index.ts', conditions: 'src/conditions.ts', types: 'src/types.ts' } },
  splitting: false,
  sourcemap: false,
  clean: true,
  target: 'node18',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.js' };
  },
});

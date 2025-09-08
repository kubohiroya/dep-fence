import { defineConfig } from 'tsup';

// Example of a repo-wide tsup base config that centralizes externals
export default defineConfig({
  entry: {},
  format: ['esm'],
  target: 'node18',
  splitting: false,
  dts: false,
  clean: false,
  external: [
    'react',
    'react-dom',
    '@mui/material',
    '@emotion/react',
    '@emotion/styled'
  ],
});


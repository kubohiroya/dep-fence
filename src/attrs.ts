import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadDefaultExternals, readTsconfig, readTsupExternals } from './loaders';
import type { PackageMeta } from './types';

const UI_HINTS = new Set([
  'react',
  'react-dom',
  '@mui/material',
  '@mui/icons-material',
  '@emotion/react',
  '@emotion/styled',
]);

export function buildPackageMeta(pkgDir: string, pkgJson: any): PackageMeta {
  const name = pkgJson.name || path.basename(pkgDir);
  const defaults = loadDefaultExternals();
  const externals = readTsupExternals(pkgDir, defaults);
  const tsconfig = readTsconfig(pkgDir);
  const deps = new Set(Object.keys(pkgJson.dependencies || {}));
  const peers = new Set(Object.keys(pkgJson.peerDependencies || {}));
  const devs = new Set(Object.keys(pkgJson.devDependencies || {}));

  const attrs = new Set<string>();
  if (pkgJson.private) attrs.add('private'); else attrs.add('publishable');
  const hasTsup = ['tsup.config.ts', 'tsup.config.mjs', 'tsup.config.js']
    .some((f) => fs.existsSync(path.join(pkgDir, f)));
  if (hasTsup || devs.has('tsup')) attrs.add('usesTsup');
  if (hasAny(pkgDir, (p) => p.endsWith('.tsx'))) attrs.add('hasTsx');
  if ([...deps, ...peers, ...devs].some((d) => UI_HINTS.has(d)) || attrs.has('hasTsx')) attrs.add('ui');
  if (deps.has('next') || devs.has('next')) attrs.add('next');
  if (deps.has('storybook') || devs.has('storybook') || devs.has('@storybook/react')) attrs.add('storybook');
  if (pkgJson.name === '@hierarchidb/app' || pkgDir.endsWith(path.sep + 'app')) attrs.add('app');
  const libs = new Set<string>((tsconfig.compilerOptions?.lib || []) as string[]);
  if ([...libs].some((l) => /dom/i.test(l)) || attrs.has('ui')) attrs.add('browser'); else attrs.add('node');
  if (/worker/i.test(name) || pkgDir.includes('worker')) attrs.add('worker');
  if (tsconfig.compilerOptions?.skipLibCheck) attrs.add('skipLibCheck');

  return { name, dir: pkgDir, pkgJson, tsconfig, externals, deps, peers, devs, attrs };
}

function hasAny(pkgDir: string, pred: (p: string) => boolean): boolean {
  const srcDir = path.join(pkgDir, 'src');
  const stack = [srcDir];
  while (stack.length) {
    const d = stack.pop();
    if (!d || !fs.existsSync(d)) continue;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (pred(p)) return true;
    }
  }
  return false;
}

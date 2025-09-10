import fs from 'node:fs';
import path from 'node:path';
import type { Rule } from '../types.js';

export type PkgUiPeersOptions = {
  roots?: string[];
  uiLibs?: string[]; // UI singletons to require as peers
  exclude?: string[]; // package names to exclude (e.g., host app)
  severity?: {
    uiInDeps?: 'error' | 'warn';
    uiMissingPeer?: 'error' | 'warn';
    peerNotExternal?: 'error' | 'warn';
    externalInDeps?: 'error' | 'warn';
  };
};

const DEFAULT_UI_LIBS = [
  'react', 'react-dom', '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'
];

function listPackageDirs(roots: string[], cwd: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const pkgPath = path.join(p, 'package.json');
        if (fs.existsSync(pkgPath)) { if (!seen.has(p)) { seen.add(p); out.push(p); } }
        walk(p);
      }
    }
  }
  for (const r of roots) walk(path.isAbsolute(r) ? r : path.join(cwd, r));
  return out;
}

function readJson(file: string): any | null {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function parseTsupExternal(dir: string, pkg: any): Set<string> {
  const out = new Set<string>();
  // from package.json tsup.external
  const ext = pkg?.tsup?.external;
  if (Array.isArray(ext)) for (const e of ext) if (typeof e === 'string') out.add(e);
  // from tsup.config.* simple regex parse
  for (const fn of ['tsup.config.ts', 'tsup.config.mjs', 'tsup.config.js']) {
    const p = path.join(dir, fn);
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    const m = s.match(/external\s*:\s*\[([\s\S]*?)\]/);
    if (m) {
      const body = m[1];
      const singles = [...body.matchAll(/'([^']+)'/g)].map((x) => x[1]);
      const doubles = [...body.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
      for (const e of [...singles, ...doubles]) out.add(e);
    }
  }
  return out;
}

export function pkgUiPeersRule(opts: PkgUiPeersOptions = {}): Rule {
  const { roots = ['packages', 'app'], uiLibs = DEFAULT_UI_LIBS, exclude = [], severity } = opts;
  const sevUiInDeps = severity?.uiInDeps || 'error';
  const sevUiMissingPeer = severity?.uiMissingPeer || 'warn';
  const sevPeerNotExternal = severity?.peerNotExternal || 'warn';
  const sevExternalInDeps = severity?.externalInDeps || 'warn';
  const excludeSet = new Set(exclude);

  return {
    name: 'pkg-ui-peers',
    async run(ctx) {
      const dirs = listPackageDirs(roots, ctx.cwd);
      for (const dir of dirs) {
        const pkgPath = path.join(dir, 'package.json');
        const pkg = readJson(pkgPath);
        if (!pkg) continue;
        const name = pkg.name || dir;
        if (excludeSet.has(name)) continue;

        const deps = new Set<string>(Object.keys(pkg.dependencies || {}));
        const peers = new Set<string>(Object.keys(pkg.peerDependencies || {}));
        const devs = new Set<string>(Object.keys(pkg.devDependencies || {}));
        const externals = parseTsupExternal(dir, pkg);

        const uiInDeps = uiLibs.filter((u) => deps.has(u));
        if (uiInDeps.length) {
          const message = `UI libs should be peerDependencies (not dependencies):\n- ${uiInDeps.join('\n- ')}`;
          (sevUiInDeps === 'warn')
            ? ctx.warn('pkg-ui-peers/ui-in-deps', { message, files: [path.relative(ctx.cwd, pkgPath)] })
            : ctx.fail('pkg-ui-peers/ui-in-deps', { message, files: [path.relative(ctx.cwd, pkgPath)] });
        }

        const installed = new Set<string>([...deps, ...devs]);
        const missingPeers = uiLibs.filter((u) => installed.has(u) && !peers.has(u));
        if (missingPeers.length) {
          const message = `UI libs installed but missing in peerDependencies:\n- ${missingPeers.join('\n- ')}`;
          (sevUiMissingPeer === 'warn')
            ? ctx.warn('pkg-ui-peers/ui-missing-peer', { message, files: [path.relative(ctx.cwd, pkgPath)] })
            : ctx.fail('pkg-ui-peers/ui-missing-peer', { message, files: [path.relative(ctx.cwd, pkgPath)] });
        }

        const peerNotExternal = uiLibs.filter((u) => peers.has(u) && !externals.has(u));
        if (peerNotExternal.length) {
          const message = `peer not in tsup.external:\n- ${peerNotExternal.join('\n- ')}`;
          (sevPeerNotExternal === 'warn')
            ? ctx.warn('pkg-ui-peers/peer-in-external', { message, files: [path.relative(ctx.cwd, pkgPath)] })
            : ctx.fail('pkg-ui-peers/peer-in-external', { message, files: [path.relative(ctx.cwd, pkgPath)] });
        }

        const externalAlsoDeps = [...externals].filter((e) => deps.has(e) && !peers.has(e));
        if (externalAlsoDeps.length) {
          const message = `external also in dependencies (consider peer):\n- ${externalAlsoDeps.join('\n- ')}`;
          (sevExternalInDeps === 'warn')
            ? ctx.warn('pkg-ui-peers/external-in-deps', { message, files: [path.relative(ctx.cwd, pkgPath)] })
            : ctx.fail('pkg-ui-peers/external-in-deps', { message, files: [path.relative(ctx.cwd, pkgPath)] });
        }
      }
    },
  };
}


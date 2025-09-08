import * as fs from 'node:fs';
import * as path from 'node:path';
import { readTsconfig, readTsupExternals } from './loaders';
import type { Finding, Severity } from './types';

const UI_PEERS = [
  'react',
  'react-dom',
  '@mui/material',
  '@mui/icons-material',
  '@emotion/react',
  '@emotion/styled',
];

export interface RuleContext {
  pkgName: string;
  pkgDir: string;
  pkgJson: any;
  defaultsExternals: string[];
  allowSkipLibCheck: Set<string>;
  because?: string;
}

function push(findings: Finding[], ctx: RuleContext, rule: string, severity: Severity, message: string) {
  findings.push({ packageName: ctx.pkgName, packageDir: ctx.pkgDir, rule, severity, message, because: ctx.because });
}

export function runRules(ctx: RuleContext): Finding[] {
  const f: Finding[] = [];
  const deps = new Set(Object.keys(ctx.pkgJson.dependencies || {}));
  const peers = new Set(Object.keys(ctx.pkgJson.peerDependencies || {}));
  const devs = new Set(Object.keys(ctx.pkgJson.devDependencies || {}));
  const externals = new Set(readTsupExternals(ctx.pkgDir, ctx.defaultsExternals));
  const tsconfig = readTsconfig(ctx.pkgDir);
  const paths = (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) || {};

  const missingExternal = [...peers].filter((p) => !externals.has(p));
  if (missingExternal.length) push(f, ctx, 'peer-in-external', 'WARN', `peer not in tsup.external:\n- ${missingExternal.join('\n- ')}`);

  const extInDepsNotPeers = [...externals].filter((e) => deps.has(e) && !peers.has(e));
  if (extInDepsNotPeers.length) push(f, ctx, 'external-in-deps', 'WARN', `external also in dependencies (consider peer):\n- ${extInDepsNotPeers.join('\n- ')}`);

  const uiInDeps = UI_PEERS.filter((u) => deps.has(u));
  if (uiInDeps.length) push(f, ctx, 'ui-in-deps', 'ERROR', `UI libs should be peerDependencies (not dependencies):\n- ${uiInDeps.join('\n- ')}`);
  const uiMissingPeer = UI_PEERS.filter((u) => (deps.has(u) || devs.has(u)) && !peers.has(u));
  if (uiMissingPeer.length) push(f, ctx, 'ui-missing-peer', 'WARN', `UI libs installed but missing in peerDependencies:\n- ${uiMissingPeer.join('\n- ')}`);

  const badPaths = Object.entries(paths)
    .flatMap(([k, arr]) => (arr as string[] || []).map((p) => ({ key: k, val: p })))
    .filter((e) => /\.\.\/.+\/src(\/|$)/.test(e.val));
  if (badPaths.length) push(
    f, ctx, 'paths-direct-src', 'WARN',
    `tsconfig paths direct src reference:\n- ${badPaths.map((e) => `${e.key} -> ${e.val}`).join('\n- ')}`
  );

  const shimDir = path.join(ctx.pkgDir, 'src', 'types');
  if (fs.existsSync(shimDir)) {
    const shims = fs.readdirSync(shimDir).filter((fn) => fn.endsWith('.d.ts'));
    if (shims.length) push(f, ctx, 'local-shims', 'WARN', `local type shims present (document policy):\n- ${shims.join('\n- ')}`);
  }

  const skip = !!(tsconfig.compilerOptions && tsconfig.compilerOptions.skipLibCheck);
  const allowInTs = !!(tsconfig.checkDeps && tsconfig.checkDeps.allowSkipLibCheck);
  if (skip) {
    if (ctx.allowSkipLibCheck.has(ctx.pkgName) || allowInTs) {
      const reason = (tsconfig.checkDeps && tsconfig.checkDeps.reason) || '';
      if (!reason && !ctx.allowSkipLibCheck.has(ctx.pkgName)) push(f, ctx, 'skipLibCheck-no-reason', 'WARN', 'skipLibCheck enabled without documented reason.');
    } else {
      push(f, ctx, 'skipLibCheck-not-allowed', 'ERROR', 'skipLibCheck is enabled but not allowed.');
    }
  }

  const ext = tsconfig.extends || '';
  if (!ext.includes('tsconfig.base.json')) push(f, ctx, 'tsconfig-no-base', 'WARN', `tsconfig does not extend repo base (tsconfig.base.json): ${ext || '(missing)'} `);

  let hasTsx = false;
  const src = path.join(ctx.pkgDir, 'src');
  const stack = [src];
  while (stack.length && !hasTsx) {
    const d = stack.pop();
    if (!d || !fs.existsSync(d)) break;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (ent.isDirectory()) stack.push(path.join(d, ent.name));
      else if (ent.name.endsWith('.tsx')) { hasTsx = true; break; }
    }
  }
  const jsxOpt = tsconfig.compilerOptions && tsconfig.compilerOptions.jsx;
  if (hasTsx && jsxOpt !== 'react-jsx') push(f, ctx, 'jsx-mismatch', 'WARN', `tsx files detected but compilerOptions.jsx is '${jsxOpt || '(unset)'}' (recommend 'react-jsx').`);

  // Enforce MapLibre encapsulation: only @hierarchidb/ui-map may depend on maplibre-gl/@vis.gl/react-maplibre
  const MAPLIBRE_PKGS = new Set(['maplibre-gl', '@vis.gl/react-maplibre']);
  const allowList = new Set(['@hierarchidb/ui-map']);
  const hasMapLibreDirect = [...MAPLIBRE_PKGS].some((p) => deps.has(p) || peers.has(p) || devs.has(p));
  if (hasMapLibreDirect && !allowList.has(ctx.pkgName)) {
    const offenders = [...MAPLIBRE_PKGS].filter((p) => deps.has(p) || peers.has(p) || devs.has(p));
    push(
      f,
      ctx,
      'maplibre-direct-dep',
      'ERROR',
      `Direct dependency on MapLibre stack is not allowed. Use @hierarchidb/ui-map wrapper instead. Found:\n- ${offenders.join('\n- ')}`,
    );
  }

  return f;
}

export type RuleRunner = (ctx: RuleContext) => Finding[];

function only(ruleIds: Set<string>, fn: RuleRunner): RuleRunner {
  return (ctx) => fn(ctx).filter((x) => ruleIds.has(x.rule));
}

export const ruleRegistry: Record<string, RuleRunner> = {
  'peer-in-external': only(new Set(['peer-in-external']), runRules),
  'external-in-deps': only(new Set(['external-in-deps']), runRules),
  'ui-in-deps': only(new Set(['ui-in-deps']), runRules),
  'ui-missing-peer': only(new Set(['ui-missing-peer']), runRules),
  'paths-direct-src': only(new Set(['paths-direct-src']), runRules),
  'local-shims': only(new Set(['local-shims']), runRules),
  'skipLibCheck-no-reason': only(new Set(['skipLibCheck-no-reason']), runRules),
  'skipLibCheck-not-allowed': only(new Set(['skipLibCheck-not-allowed']), runRules),
  'tsconfig-no-base': only(new Set(['tsconfig-no-base']), runRules),
  'jsx-mismatch': only(new Set(['jsx-mismatch']), runRules),
  'maplibre-direct-dep': only(new Set(['maplibre-direct-dep']), runRules),
};

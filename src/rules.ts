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
  ruleOptions?: any;
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
  'source-import-ban': runSourceImportBan,
  'tsconfig-paths': runTsconfigPaths,
  'package-exports-guard': runPackageExportsGuard,
  'package-types-dist': runPackageTypesDist,
};

// --- New Rules ---

function runSourceImportBan(ctx: RuleContext): Finding[] {
  const f: Finding[] = [];
  const opts = ctx.ruleOptions as { from: string | string[]; names: string[] } | undefined;
  if (!opts || !opts.from || !opts.names || !opts.names.length) return f;
  const fromList = Array.isArray(opts.from) ? opts.from : [opts.from];
  const banned = new Set(opts.names);

  const srcDir = path.join(ctx.pkgDir, 'src');
  const offenders: { file: string; names: string[] }[] = [];
  const stack = [srcDir];
  while (stack.length) {
    const d = stack.pop();
    if (!d || !fs.existsSync(d)) continue;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) { stack.push(p); continue; }
      if (!/\.tsx?$/.test(ent.name)) continue;
      const src = safeRead(p);
      if (!src) continue;
      const matches = collectNamedImports(src);
      for (const m of matches) {
        if (!fromList.includes(m.from)) continue;
        const hits = m.names.filter((n) => banned.has(n));
        if (hits.length) offenders.push({ file: path.relative(ctx.pkgDir, p), names: hits });
      }
    }
  }
  if (offenders.length) {
    const msg = offenders
      .map((o) => `${o.file}: ${o.names.join(', ')}`)
      .join('\n- ');
    push(f, ctx, 'source-import-ban', 'ERROR', `banned named imports detected from ${fromList.join(', ')}:\n- ${msg}`);
  }
  return f;
}

function collectNamedImports(src: string): { from: string; names: string[] }[] {
  const out: { from: string; names: string[] }[] = [];
  const re = /import\s+(?:type\s+)?(?:[^'"{]*\{\s*([^}]*)\s*\}[^'"}]*)?\s*from\s*['"]([^'"\n]+)['"];?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const group = (m[1] || '').trim();
    if (!group) continue;
    const names = group
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.split(/\s+as\s+/i)[0].trim());
    out.push({ from: m[2], names });
  }
  return out;
}

function safeRead(file: string): string | null {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function runTsconfigPaths(ctx: RuleContext): Finding[] {
  const f: Finding[] = [];
  const opts = ctx.ruleOptions as { forbidPattern?: string; allowPattern?: string } | undefined;
  const tsconfig = readTsconfig(ctx.pkgDir);
  const paths = (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) || {};
  const allow = opts?.allowPattern ? new RegExp(opts.allowPattern) : null;
  const forbid = opts?.forbidPattern ? new RegExp(opts.forbidPattern) : null;

  const bad: { key: string; val: string; reason: string }[] = [];
  for (const [k, arr] of Object.entries(paths)) {
    for (const v of (arr as string[]) || []) {
      const s = String(v);
      if (allow && allow.test(s)) continue;
      if (forbid && forbid.test(s)) bad.push({ key: k, val: s, reason: 'forbidden pattern' });
    }
  }
  if (bad.length) {
    const msg = bad.map((b) => `${b.key} -> ${b.val} (${b.reason})`).join('\n- ');
    push(f, ctx, 'tsconfig-paths', 'ERROR', `tsconfig paths violation:\n- ${msg}`);
  }
  return f;
}

function runPackageExportsGuard(ctx: RuleContext): Finding[] {
  const f: Finding[] = [];
  const opts = ctx.ruleOptions as { subpathPattern: string; forbidFields?: string[]; requireFields?: string[] } | undefined;
  if (!opts?.subpathPattern) return f;
  const re = new RegExp(opts.subpathPattern);
  const exps = ctx.pkgJson.exports;
  const norm = normalizeExports(exps);
  const forbid = new Set(opts.forbidFields || []);
  const requireList = new Set(opts.requireFields || []);

  const issues: string[] = [];
  for (const [key, obj] of Object.entries(norm)) {
    if (!re.test(key)) continue;
    const fields = Object.keys(obj || {});
    for (const fd of forbid) if (fields.includes(fd)) issues.push(`${key}: forbid field '${fd}'`);
    for (const rq of requireList) if (!fields.includes(rq)) issues.push(`${key}: missing required field '${rq}'`);
  }
  if (issues.length) push(f, ctx, 'package-exports-guard', 'ERROR', issues.map((s) => `- ${s}`).join('\n'));
  return f;
}

function normalizeExports(exps: any): Record<string, Record<string, any>> {
  if (!exps) return {};
  if (typeof exps === 'string') return { '.': { default: exps } };
  const out: Record<string, Record<string, any>> = {};
  for (const [k, v] of Object.entries(exps)) {
    if (typeof v === 'string') out[k] = { default: v };
    else if (v && typeof v === 'object') out[k] = v as Record<string, any>;
  }
  return out;
}

function runPackageTypesDist(ctx: RuleContext): Finding[] {
  const f: Finding[] = [];
  const opts = ctx.ruleOptions as { requireDistForEntries: string[] } | undefined;
  const entries = opts?.requireDistForEntries || [];
  if (!entries.length) return f;
  const isDistDts = (s: any) => typeof s === 'string' && /(^\.?\/?dist\/).*\.d\.ts$/.test(s);
  const exps = normalizeExports(ctx.pkgJson.exports);

  const problems: string[] = [];
  for (const e of entries) {
    if (e === '.') {
      if (!isDistDts(ctx.pkgJson.types)) problems.push(`package.json types must point to dist/*.d.ts`);
      const t = exps['.']?.types;
      if (!isDistDts(t)) problems.push(`exports["."].types must point to dist/*.d.ts`);
    } else {
      const t = exps[e]?.types;
      if (!isDistDts(t)) problems.push(`exports["${e}"].types must point to dist/*.d.ts`);
    }
  }
  if (problems.length) push(f, ctx, 'package-types-dist', 'ERROR', problems.map((s) => `- ${s}`).join('\n'));
  return f;
}

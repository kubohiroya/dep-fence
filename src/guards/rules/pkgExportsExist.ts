import fs from 'node:fs';
import path from 'node:path';
import type { Rule } from '../types.js';

export type PkgExportsExistOptions = {
  roots?: string[]; // directories to scan for packages
  action?: 'error' | 'warn';
};

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
        if (fs.existsSync(pkgPath)) {
          if (!seen.has(p)) { seen.add(p); out.push(p); }
        }
        walk(p);
      }
    }
  }
  for (const r of roots) walk(path.isAbsolute(r) ? r : path.join(cwd, r));
  return out;
}

export function pkgExportsExistRule(opts: PkgExportsExistOptions = {}): Rule {
  const { roots = ['packages', 'app'], action = 'error' } = opts;
  return {
    name: 'pkg-exports-exist',
    async run(ctx) {
      const dirs = listPackageDirs(roots, ctx.cwd);
      const offenders: string[] = [];

      for (const dir of dirs) {
        const pkgPath = path.join(dir, 'package.json');
        let pkg: any;
        try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch { continue; }
        const checkPath = (rel?: string) => {
          if (!rel || typeof rel !== 'string') return;
          const p = path.join(dir, rel);
          if (!fs.existsSync(p)) offenders.push(`${path.relative(ctx.cwd, dir)} -> ${rel}`);
        };
        // main/module
        checkPath(pkg.main);
        checkPath(pkg.module);
        // exports
        const ex = pkg.exports;
        if (typeof ex === 'string') checkPath(ex);
        else if (ex && typeof ex === 'object') {
          for (const v of Object.values(ex)) {
            if (typeof v === 'string') checkPath(v as string);
            else if (v && typeof v === 'object') {
              const vv = v as any;
              ['import', 'default', 'require', 'types'].forEach((fld) => vv[fld] && checkPath(vv[fld]));
            }
          }
        }
      }

      if (offenders.length) {
        const message = 'package.json main/module/exports points to non-existent files';
        if (action === 'warn') ctx.warn('pkg-exports-exist', { message, files: offenders });
        else ctx.fail('pkg-exports-exist', { message, files: offenders });
      }
    },
  };
}


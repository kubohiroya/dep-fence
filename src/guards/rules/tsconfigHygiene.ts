import fs from 'node:fs';
import path from 'node:path';
import type { Rule } from '../types.js';

export type TsconfigHygieneOptions = {
  roots?: string[];
  requireBaseExtends?: boolean; // enforce extends tsconfig.base.json
  jsxShouldBe?: 'react-jsx' | 'react-jsxdev' | 'preserve' | 'react';
  skipLibCheck: {
    allowedPackages?: string[]; // package names allowed to keep skipLibCheck
    action?: 'error' | 'warn';
    requireReasonField?: boolean; // if true, require checkDeps.reason when allowed
  };
};

function listTsconfigs(roots: string[], cwd: string): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const f = path.join(p, 'tsconfig.json');
        if (fs.existsSync(f)) out.push(f);
        walk(p);
      }
    }
  }
  for (const r of roots) walk(path.isAbsolute(r) ? r : path.join(cwd, r));
  return out;
}

function readJson(file: string): any | null { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }

export function tsconfigHygieneRule(opts: TsconfigHygieneOptions): Rule {
  const { roots = ['packages', 'app'], requireBaseExtends = true, jsxShouldBe = 'react-jsx', skipLibCheck } = opts;
  const allowSkip = new Set(skipLibCheck?.allowedPackages || []);
  const skipAction = skipLibCheck?.action || 'error';
  const requireReason = !!skipLibCheck?.requireReasonField;

  return {
    name: 'tsconfig-hygiene',
    async run(ctx) {
      const files = listTsconfigs(roots, ctx.cwd);
      for (const f of files) {
        const j = readJson(f); if (!j) continue;
        const pkgDir = path.dirname(f);
        const pkgJson = readJson(path.join(pkgDir, 'package.json')) || {};
        const pkgName = pkgJson.name || pkgDir;

        // extends base
        if (requireBaseExtends) {
          const ext = String(j.extends || '');
          if (!ext.includes('tsconfig.base.json')) {
            ctx.warn('tsconfig-no-base', { message: `tsconfig does not extend repo base (tsconfig.base.json): ${ext || '(missing)'}`, files: [path.relative(ctx.cwd, f)] });
          }
        }

        // jsx setting
        const jsx = j.compilerOptions?.jsx;
        let hasTsx = false;
        const src = path.join(pkgDir, 'src');
        const stack = [src];
        while (stack.length && !hasTsx) {
          const d = stack.pop()!;
          if (!fs.existsSync(d)) break;
          for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
            if (ent.isDirectory()) stack.push(path.join(d, ent.name));
            else if (ent.name.endsWith('.tsx')) { hasTsx = true; break; }
          }
        }
        if (hasTsx && jsx !== jsxShouldBe) {
          ctx.warn('jsx-mismatch', { message: `tsx files detected but compilerOptions.jsx is '${jsx || '(unset)'}' (recommend '${jsxShouldBe}').`, files: [path.relative(ctx.cwd, f)] });
        }

        // skipLibCheck governance
        const skip = !!(j.compilerOptions && j.compilerOptions.skipLibCheck);
        if (skip) {
          if (allowSkip.has(pkgName) || j.checkDeps?.allowSkipLibCheck) {
            if (requireReason) {
              const reason = j.checkDeps?.reason || '';
              if (!reason) ctx.warn('skipLibCheck-no-reason', { message: 'skipLibCheck enabled without documented reason.', files: [path.relative(ctx.cwd, f)] });
            }
          } else {
            const message = 'skipLibCheck is enabled but not allowed.';
            (skipAction === 'warn')
              ? ctx.warn('skipLibCheck-not-allowed', { message, files: [path.relative(ctx.cwd, f)] })
              : ctx.fail('skipLibCheck-not-allowed', { message, files: [path.relative(ctx.cwd, f)] });
          }
        }
      }
    },
  };
}


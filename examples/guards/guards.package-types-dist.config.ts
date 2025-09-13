// Guards: package types must point to dist/*.d.ts (root and sub-entries)
import type { Rule } from '../../src/guards/types';
import * as fs from 'node:fs';
import * as path from 'node:path';

function readJson(p: string) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

function normalizeExports(exps: any): Record<string, Record<string, any>> {
  if (!exps) return {};
  if (typeof exps === 'string') return { '.': { default: exps } };
  const out: Record<string, Record<string, any>> = {};
  for (const [k, v] of Object.entries(exps)) out[k] = typeof v === 'string' ? { default: v } : (v as any);
  return out;
}

const rules: Rule[] = [
  {
    name: 'package-types-dist',
    run: (ctx) => {
      const roots = ['packages', 'app'];
      const offenders: string[] = [];
      const isDistDts = (s: any) => typeof s === 'string' && /(\/?|^)dist\/.*\.d\.ts$/.test(s);
      for (const r of roots) {
        const base = path.join(ctx.cwd, r);
        if (!fs.existsSync(base)) continue;
        const stack = [base];
        while (stack.length) {
          const d = stack.pop()!;
          for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, ent.name);
            if (ent.isDirectory()) { if (!ent.name.startsWith('.') && ent.name !== 'node_modules' && ent.name !== 'dist') stack.push(p); continue; }
            if (ent.name !== 'package.json') continue;
            const pkg = readJson(p) || {};
            const rel = path.relative(ctx.cwd, p);
            const exps = normalizeExports(pkg.exports);
            const problems: string[] = [];
            if (!isDistDts(pkg.types)) problems.push('package.json types must point to dist/*.d.ts');
            for (const key of Object.keys(exps)) {
              const t = (exps as any)[key]?.types;
              if (t !== undefined && !isDistDts(t)) problems.push(`exports[${key}].types must point to dist/*.d.ts`);
            }
            if (problems.length) offenders.push(`${rel}: ${problems.join('; ')}`);
          }
        }
      }
      if (offenders.length) ctx.fail('package-types-dist', { message: 'types must point to dist/*.d.ts', files: offenders });
    },
  },
];

export default rules;


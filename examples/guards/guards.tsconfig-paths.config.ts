// Guards: tsconfig paths hygiene — allow dist/*.d.ts, forbid ../src
import type { Rule } from '../../src/guards/types';
import * as fs from 'node:fs';
import * as path from 'node:path';

function readJson(p: string) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

const rules: Rule[] = [
  {
    name: 'tsconfig-paths-hygiene',
    run: (ctx) => {
      const roots = ['packages', 'app'];
      const offenders: string[] = [];
      for (const r of roots) {
        const base = path.join(ctx.cwd, r);
        if (!fs.existsSync(base)) continue;
        const stack = [base];
        while (stack.length) {
          const d = stack.pop()!;
          for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, ent.name);
            if (ent.isDirectory()) { if (!ent.name.startsWith('.') && ent.name !== 'node_modules' && ent.name !== 'dist') stack.push(p); continue; }
            if (ent.name !== 'tsconfig.json') continue;
            const ts = readJson(p) || {};
            const paths = (ts.compilerOptions && ts.compilerOptions.paths) || {};
            for (const [k, arr] of Object.entries(paths)) {
              for (const v of (arr as any) || []) {
                const s = String(v);
                const allow = /(^|\/)dist\/.*\.d\.ts$/;
                if (allow.test(s)) continue;
                if (/\.\.\/.+\/src(\/|$)/.test(s)) offenders.push(`${path.relative(ctx.cwd, p)}: ${k} -> ${s}`);
              }
            }
          }
        }
      }
      if (offenders.length) ctx.fail('tsconfig-paths-hygiene', { message: 'paths must point to dist/*.d.ts (avoid ../src)', files: offenders });
    },
  },
];

export default rules;


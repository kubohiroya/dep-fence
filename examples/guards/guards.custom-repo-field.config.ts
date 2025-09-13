// Guards: custom rule — require repository field in package.json
import type { Rule } from '../../src/guards/types';
import * as fs from 'node:fs';
import * as path from 'node:path';

function readJson(p: string) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

const rules: Rule[] = [
  {
    name: 'require-repo-field',
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
            if (ent.name !== 'package.json') continue;
            const pkg = readJson(p) || {};
            if (!pkg.repository) offenders.push(path.relative(ctx.cwd, p));
          }
        }
      }
      if (offenders.length) ctx.warn('require-repo-field', { message: 'package.json should include a repository field', files: offenders });
    },
  },
];

export default rules;


// Guards: source import ban — ban specific named imports from a module
import type { Rule } from '../../src/guards/types';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

function read(file: string) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }

const BANNED_FROM = '@hierarchidb/common-type';
const BANNED_NAMES = new Set(['EntityId', 'toEntityId', 'generateEntityId']);

const rules: Rule[] = [
  {
    name: 'source-import-ban',
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
            if (!/\.(t|j)sx?$/.test(ent.name)) continue;
            const code = read(p);
            if (!code) continue;
            const imps = collectNamedImports(code).filter((x) => x.from === BANNED_FROM);
            for (const imp of imps) {
              const hits = imp.names.filter((n) => BANNED_NAMES.has(n));
              if (hits.length) offenders.push(`${path.relative(ctx.cwd, p)}: ${hits.join(', ')}`);
            }
          }
        }
      }
      if (offenders.length) ctx.fail('source-import-ban', { message: `banned named imports from ${BANNED_FROM}`, files: offenders });
    },
  },
];

export default rules;


// Guards: MapLibre allowlist — only wrapper packages may depend on maplibre libs
import type { Rule } from '../../src/guards/types';
import * as fs from 'node:fs';
import * as path from 'node:path';

const LIBS = new Set(['maplibre-gl', '@vis.gl/react-maplibre']);
const ALLOW = new Set(['@hierarchidb/ui-map']);

function readJson(p: string) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

const rules: Rule[] = [
  {
    name: 'maplibre-allowlist',
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
            const name = pkg.name || '';
            if (ALLOW.has(name)) continue;
            const deps = new Set([
              ...Object.keys(pkg.dependencies || {}),
              ...Object.keys(pkg.peerDependencies || {}),
              ...Object.keys(pkg.devDependencies || {}),
            ]);
            const hits = [...LIBS].filter((x) => deps.has(x));
            if (hits.length) offenders.push(`${path.relative(ctx.cwd, p)}: ${hits.join(', ')}`);
          }
        }
      }
      if (offenders.length) ctx.fail('maplibre-allowlist', { message: 'direct MapLibre deps are forbidden outside the wrapper', files: offenders });
    },
  },
];

export default rules;


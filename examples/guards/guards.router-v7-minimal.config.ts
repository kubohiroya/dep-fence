// Guards: Router v7 minimal — forbid react-router-dom runtime in non-UI packages
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

const roots = ['packages', 'app'];
const uiHints = [/\bui\b/i, /-ui($|\b)/i];
const banned = new Set([
  'Link', 'NavLink', 'Outlet',
  'useNavigate', 'useLocation', 'useParams', 'useSearchParams',
  'createBrowserRouter', 'createMemoryRouter', 'RouterProvider',
]);

const rules: Rule[] = [
  {
    name: 'router-v7-minimal',
    run: (ctx) => {
      const root = ctx.cwd;
      const offenders: string[] = [];
      for (const r of roots) {
        const abs = path.join(root, r);
        if (!fs.existsSync(abs)) continue;
        const stack = [abs];
        while (stack.length) {
          const d = stack.pop()!;
          for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, ent.name);
            if (ent.isDirectory()) {
              if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name.startsWith('.')) continue;
              stack.push(p);
              continue;
            }
            if (ent.name !== 'package.json') continue;
            const pkgDir = path.dirname(p);
            const pkg = JSON.parse(read(p) || '{}');
            const isUi = (() => {
              const name: string = pkg.name || '';
              const kw: string[] = Array.isArray(pkg.keywords) ? pkg.keywords : [];
              if (kw.some(k => /\bui\b/i.test(String(k)))) return true;
              return uiHints.some(re => re.test(name));
            })();
            if (isUi) continue; // only check non-UI packages

            // scan src/**/*.{ts,tsx,js,jsx}
            const src = path.join(pkgDir, 'src');
            const q = [src];
            while (q.length) {
              const dd = q.pop()!;
              if (!fs.existsSync(dd)) continue;
              for (const ent2 of fs.readdirSync(dd, { withFileTypes: true })) {
                const pp = path.join(dd, ent2.name);
                if (ent2.isDirectory()) { q.push(pp); continue; }
                if (!/\.(t|j)sx?$/.test(ent2.name)) continue;
                const code = read(pp);
                if (!code) continue;
                const imports = collectNamedImports(code).filter(x => x.from === 'react-router-dom');
                const hit = imports.flatMap(x => x.names).some(n => banned.has(n));
                if (hit) offenders.push(path.relative(root, pp));
              }
            }
          }
        }
      }
      if (offenders.length) ctx.fail('router-v7-minimal', { message: 'react-router-dom runtime found in non-UI packages', files: offenders });
    },
  },
];

export default rules;


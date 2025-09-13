import type { Policy } from 'dep-fence/types';
import { all, isPublishable, isUI } from 'dep-fence/conditions';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Apps-only: allow router constructors/providers only under specific UI folders (e.g., src/app, src/routes)
export const policies: Policy[] = [
  {
    id: 'react-router-v7-apps-only',
    when: all(isPublishable(), isUI()),
    because: 'Keep router setup in app/route modules; avoid leakage into shared UI libs.',
    rules: [
      {
        rule: 'custom',
        id: 'router-constructors-scope',
        run: (ctx) => {
          const findings: any[] = [];
          const allowed = new Set([
            'src/app',
            'src/routes',
          ]);
          const lookFor = new Set([
            'createBrowserRouter',
            'createMemoryRouter',
            'RouterProvider',
          ]);

          const srcDir = path.join(ctx.pkgDir, 'src');
          const stack = [srcDir];
          while (stack.length) {
            const d = stack.pop();
            if (!d || !fs.existsSync(d)) continue;
            for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
              const p = path.join(d, ent.name);
              if (ent.isDirectory()) { stack.push(p); continue; }
              if (!/\.(?:t|j)sx?$/.test(ent.name)) continue;
              const rel = path.relative(ctx.pkgDir, p).replace(/\\/g, '/');
              const okDir = [...allowed].some((base) => rel.startsWith(base + '/'));
              const src = safeRead(p);
              if (!src) continue;
              const matches = collectNamedImports(src);
              for (const m of matches) {
                if (m.from !== 'react-router-dom') continue;
                const hits = m.names.filter((n) => lookFor.has(n));
                if (hits.length && !okDir) {
                  findings.push({
                    packageName: ctx.pkgName,
                    packageDir: ctx.pkgDir,
                    rule: 'router-constructors-outside-allowed',
                    severity: 'WARN',
                    message: `${rel}: ${hits.join(', ')} (allow only under ${[...allowed].join(', ')})`,
                    because: ctx.because,
                  });
                }
              }
            }
          }
          return findings;
        },
      },
    ],
  },
];

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


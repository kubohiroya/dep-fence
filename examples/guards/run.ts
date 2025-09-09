// Minimal guard runner for examples.
// Usage:
//   pnpm dlx tsx examples/guards/run.ts --mode pre-commit
//   pnpm dlx tsx examples/guards/run.ts --mode pre-push
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runRules } from '../../src/guards/index';
import type { GuardMode, Rule } from '../../src/guards/types';

const mode = (process.argv.includes('--mode')
  ? (process.argv[process.argv.indexOf('--mode') + 1] as GuardMode)
  : 'pre-commit') as GuardMode;

const cfgRel = process.env.DEP_FENSE_GUARDS || 'examples/guards/guards.config.ts';
const cfgPath = path.resolve(process.cwd(), cfgRel);

const mod = await import(pathToFileURL(cfgPath).toString());
const rules: Rule[] = (mod.default ?? mod.rules) as Rule[];

const warnings: any[] = [];
const failures: any[] = [];
const ctx = {
  mode,
  cwd: process.cwd(),
  warn: (name: string, p: any) => warnings.push({ name, ...p }),
  fail: (name: string, p: any) => failures.push({ name, ...p }),
};

for (const r of rules) {
  await Promise.resolve(r.run(ctx as any)).catch((e) => {
    failures.push({ name: r.name, message: e?.message ?? String(e) });
  });
}

for (const w of warnings) {
  console.warn(`WARN [${w.name}] ${w.message}`);
  if (w.files?.length) w.files.forEach((f: string) => console.warn(`  - ${f}`));
}
if (failures.length) {
  for (const f of failures) {
    console.error(`ERROR [${f.name}] ${f.message}`);
    if (f.files?.length) f.files.forEach((ff: string) => console.error(`  - ${ff}`));
  }
  process.exit(1);
}

console.log(`dep-fense guards: ${mode} OK`);


#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runWithPolicies } from './engine';
import { printFindings, findingsToJson, findingsToYaml, findingsToYamlByRule, findingsToYamlBySeverity } from './reporters';
import { defaultPolicies } from './config.default';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';

function getArg(name: string): string | null {
  const i = process.argv.indexOf(name);
  if (i >= 0 && i + 1 < process.argv.length) return process.argv[i + 1];
  return null;
}

async function loadUserPolicies(): Promise<any | null> {
  const root = findRepoRoot(process.cwd());
  const cliConfig = getArg('--config') ?? getArg('-c');
  const candidates = [
    cliConfig || '',
    process.env.DEP_FENCE_CONFIG || '',
    path.join(root, 'dep-fence.config.ts'),
    path.join(root, 'dep-fence.config.mjs'),
    path.join(root, 'dep-fence.config.js'),
  ].filter(Boolean);
  const file = candidates.find((f) => fs.existsSync(f));
  if (!file) return null;
  try {
    const mod = await import(pathToFileUrl(file));
    return mod.policies || null;
  } catch (e: any) {
    // Fallback TS loader for .ts configs without ts-node/tsx
    if (file.endsWith('.ts')) {
      const mod = await import(pathToFileUrl(transpileTsConfigToTemp(file)));
      return (mod as any).policies || null;
    }
    throw e;
  }
}

function findRepoRoot(start: string): string {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml')) || fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return start;
}

function pathToFileUrl(p: string) {
  const abs = path.resolve(p);
  const url = new URL('file://');
  url.pathname = abs;
  return url.href;
}

function transpileTsConfigToTemp(file: string): string {
  const src = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  let out = src;
  // strip type-only imports/exports
  out = out.replace(/^\s*import\s+type\s+[^;]+;?\s*$/gm, '');
  out = out.replace(/^\s*export\s+type\s+[^;]+;?\s*$/gm, '');
  // remove obvious var type annotations like: export const policies: Policy[] =
  out = out.replace(/export\s+const\s+(\w+)\s*:\s*[^=\n]+=/g, 'export const $1 =');
  // drop "as const" to keep runtime JS valid
  out = out.replace(/\s+as\s+const\b/g, '');
  // write temp .mjs next to original
  const dir = path.dirname(file);
  const tmp = path.join(dir, `.dep-fence.tmp.${Date.now()}.mjs`);
  fs.writeFileSync(tmp, out, 'utf8');
  return tmp;
}

async function main() {
  // support -v/--version
  if (process.argv.includes('-v') || process.argv.includes('--version')) {
    try {
      const here = path.dirname(fileURLToPath(import.meta.url));
      const pkgPath = path.join(here, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { version?: string; name?: string };
      console.log(pkg.version || '0.0.0');
    } catch {
      console.log('unknown');
    }
    return;
  }

  // support -h/--help
  if (process.argv.includes('-h') || process.argv.includes('--help')) {
    const lines = [
      'Usage: dep-fence [options]',
      '',
      'Options:',
      '  -h, --help            Show this help and exit',
      '  -v, --version         Print version and exit',
      '  -c, --config <file>   Path to dep-fence.config.(ts|mjs|js)',
      '  -f, --format <fmt>    Output format: pretty|json|yaml (default: yaml)',
      '  -g, --group-by <key>  YAML grouping: package|rule|severity (default: package)',
      '  --strict              Exit with code 1 if any ERROR',
      '',
      'Examples:',
      '  dep-fence                 # YAML (default)',
      '  dep-fence -f pretty            # human‑readable',
      '  dep-fence -f json | jq',
      '  dep-fence -f yaml -g severity',
      '  dep-fence --strict',
      '  dep-fence -c ./dep-fence.config.ts',
    ];
    console.log(lines.join(os.EOL));
    return;
  }
  const user = await loadUserPolicies();
  const policies = Array.isArray(user) ? user : defaultPolicies;
  const findings = runWithPolicies(policies);
  let format = getArg('--format') ?? getArg('-f');
  const groupBy = (getArg('--group-by') ?? getArg('-g')) || 'package';
  switch (format) {
    case 'json':
      console.log(findingsToJson(findings));
      break;
    case 'pretty':
      printFindings(findings);
      break;
    case 'yaml':
    default:
      if (groupBy === 'rule') console.log(findingsToYamlByRule(findings));
      else if (groupBy === 'severity') console.log(findingsToYamlBySeverity(findings));
      else console.log(findingsToYaml(findings));
      break;
  }
  const hasError = findings.some((f) => f.severity === 'ERROR');
  if (process.argv.includes('--strict') && hasError) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

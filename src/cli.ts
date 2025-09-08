#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runWithPolicies } from './engine';
import { printFindings, findingsToJson } from './reporters';
import { defaultPolicies } from './config.default';

async function loadUserPolicies(): Promise<any | null> {
  const root = findRepoRoot(process.cwd());
  const candidates = [
    process.env.DEP_FENCE_CONFIG || '',
    path.join(root, 'dep-fence.config.ts'),
    path.join(root, 'dep-fence.config.mjs'),
    path.join(root, 'dep-fence.config.js'),
  ].filter(Boolean);
  const file = candidates.find((f) => fs.existsSync(f));
  if (!file) return null;
  const mod = await import(pathToFileUrl(file));
  return mod.policies || null;
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

async function main() {
  const user = await loadUserPolicies();
  const policies = Array.isArray(user) ? user : defaultPolicies;
  const findings = runWithPolicies(policies);
  if (process.argv.includes('--json')) {
    console.log(findingsToJson(findings));
  } else {
    printFindings(findings);
  }
  const hasError = findings.some((f) => f.severity === 'ERROR');
  if (process.argv.includes('--strict') && hasError) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

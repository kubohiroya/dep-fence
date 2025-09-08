import * as path from 'node:path';
import { listPackageDirs, loadDefaultExternals, readJson, readRepoConfig } from './loaders';
import { buildPackageMeta } from './attrs';
import type { Finding, Policy } from './types';
import { ruleRegistry, type RuleContext } from './rules';

export function runWithPolicies(policies: Policy[]): Finding[] {
  const results: Finding[] = [];
  const allowSkip = new Set(readRepoConfig().allowSkipLibCheck || []);
  const defaults = loadDefaultExternals();
  const pkgDirs = listPackageDirs();
  for (const dir of pkgDirs) {
    const pkgJson = readJson<any>(path.join(dir, 'package.json'));
    if (!pkgJson) continue;
    const meta = buildPackageMeta(dir, pkgJson);

    for (const p of policies) {
      const match = p.when(meta);
      if (!match.ok) continue;
      const because = p.because || match.because;
      const ctx: RuleContext = {
        pkgName: meta.name,
        pkgDir: meta.dir,
        pkgJson: meta.pkgJson,
        defaultsExternals: defaults,
        allowSkipLibCheck: allowSkip,
        because,
      };
      for (const id of p.rules) {
        const run = ruleRegistry[id];
        if (!run) continue;
        const fs = run(ctx).map((f) => {
          const override = p.severityOverride?.[f.rule];
          return override ? { ...f, severity: override } : f;
        });
        results.push(...fs);
      }
    }
  }
  return results;
}

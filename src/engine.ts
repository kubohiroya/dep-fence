import * as path from 'node:path';
import { listPackageDirs, loadDefaultExternals, readJson, readRepoConfig } from './loaders';
import { buildPackageMeta } from './attrs';
import type { Finding, Policy, CustomRule } from './types';
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
      const baseCtx: RuleContext = {
        pkgName: meta.name,
        pkgDir: meta.dir,
        pkgJson: meta.pkgJson,
        defaultsExternals: defaults,
        allowSkipLibCheck: allowSkip,
        because,
      };
      for (const entry of p.rules) {
        if (typeof entry === 'string') {
          const id = entry;
          const run = ruleRegistry[id];
          if (!run) continue;
          const ctx: RuleContext = { ...baseCtx, ruleOptions: p.options?.[id] } as RuleContext;
          const fs = run(ctx).map((f) => {
            const override = p.severityOverride?.[f.rule];
            return override ? { ...f, severity: override } : f;
          });
          results.push(...fs);
        } else {
          const cr = entry as CustomRule;
          if (cr.rule !== 'custom' || typeof cr.run !== 'function') continue;
          try {
            const fs = cr.run(baseCtx as any).map((f) => {
              const id = cr.id || 'custom';
              const r = { ...f, rule: f.rule || id } as Finding;
              const override = p.severityOverride?.[r.rule];
              return override ? { ...r, severity: override } : r;
            });
            results.push(...fs);
          } catch (e: any) {
            results.push({
              packageName: baseCtx.pkgName,
              packageDir: baseCtx.pkgDir,
              rule: 'custom-rule-failed',
              severity: 'ERROR',
              message: `custom rule threw: ${e?.message || e}`,
              because: baseCtx.because,
            });
          }
        }
      }
    }
  }
  return results;
}

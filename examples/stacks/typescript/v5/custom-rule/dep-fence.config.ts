// Re-export demo custom rule policy
import type { Policy } from 'dep-fence/types';
import { any, isPublishable } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'custom-checks',
    when: any(isPublishable()),
    because: 'Repo-specific validation that is not covered by built-in rules.',
    rules: [
      {
        rule: 'custom',
        id: 'require-repo-field',
        run: (ctx) => {
          const findings: any[] = [];
          const hasRepo = !!ctx.pkgJson.repository;
          if (!hasRepo) {
            findings.push({
              packageName: ctx.pkgName,
              packageDir: ctx.pkgDir,
              rule: 'require-repo-field',
              severity: 'WARN',
              message: 'package.json should include a "repository" field',
              because: ctx.because,
            });
          }
          return findings;
        },
      },
    ],
  },
];

// Example guard configuration using dep-fense/guards
// Copy this file into your repo (e.g. .mrtask/dep-fense.guards.ts) and adjust globs.
import type { Rule } from '../../src/guards/types';
import { allowedDirsRule, mtimeCompareRule, upstreamConflictRule } from '../../src/guards/index';

const allow = [
  'packages/**',
  'src/**',
  'README.md',
  'LICENSE',
  '.github/**',
];

const rules: Rule[] = [
  // 1) Allowed directories (strict)
  allowedDirsRule({ allow, action: 'error' }),

  // 2) mtime compare (lightweight advisory)
  mtimeCompareRule({
    groupA: ['packages/**', 'src/**', '!**/dist/**', '!**/.cache/**', '!**/coverage/**', '!**/node_modules/**'],
    groupB: ['.mrtask/dep-fense.guards.ts', 'packages/**/.mrtask/**'],
    action: 'warn',
    epsilonMs: 1500,
  }),

  // 3) Upstream conflict (optimistic)
  upstreamConflictRule({
    watch: ['packages/**', 'src/**', '!**/dist/**', '!**/.cache/**', '!**/coverage/**', '!**/node_modules/**'],
    action: 'error',
  }),
];

export default rules;


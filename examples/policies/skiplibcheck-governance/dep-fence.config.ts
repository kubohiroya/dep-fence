import type { Policy } from 'dep-fence/types';
import { hasSkipLibCheck } from 'dep-fence/conditions';

// Govern skipLibCheck: either allow list it repo-wide or document a reason per package tsconfig
export const policies: Policy[] = [
  {
    id: 'skipLibCheck-governance',
    when: hasSkipLibCheck(),
    because: 'skipLibCheck is technical debt; use only with explicit permission and a documented reason.',
    rules: ['skipLibCheck-not-allowed', 'skipLibCheck-no-reason'],
  },
];

// Guidance
// OK:  tsconfig.json { compilerOptions: { skipLibCheck: true }, checkDeps: { allowSkipLibCheck: true, reason: "Temporary 3rd‑party types mismatch" } }
//      or package is allow-listed in repo-level dep-fence.config.json (allowSkipLibCheck array).
// NG:  skipLibCheck is enabled without repo permission, or permission exists but no reason is recorded.


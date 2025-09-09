import type { Policy } from 'dep-fence/types';
import { isPublishable } from 'dep-fence/conditions';

// Discourage long-lived local declaration shims under src/types/*.d.ts in publishable packages
export const policies: Policy[] = [
  {
    id: 'publishable-local-shims',
    when: isPublishable(),
    because: 'Local *.d.ts shims in published packages tend to hide broken types; prefer fixing at source or isolating temporarily.',
    rules: ['local-shims'],
    severityOverride: { 'local-shims': 'WARN' },
  },
];

// Guidance
// OK:  Temporary shims placed under src/types/*.d.ts with an associated issue and clear removal timeline.
// NG:  Accumulating permanent shims to paper over type problems; this will be flagged so teams plan cleanup.


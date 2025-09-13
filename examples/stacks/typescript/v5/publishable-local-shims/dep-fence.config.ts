// Discourage long-lived local *.d.ts shims under src/types for publishable packages
import type { Policy } from 'dep-fence/types';
import { isPublishable } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'publishable-local-shims',
    when: isPublishable(),
    because: 'Local *.d.ts shims in published packages tend to hide broken types; prefer fixing at source or isolating temporarily.',
    rules: ['local-shims'],
    severityOverride: { 'local-shims': 'WARN' },
  },
];

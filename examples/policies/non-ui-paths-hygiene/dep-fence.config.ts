import type { Policy } from 'dep-fence/types';
import { isPublishable } from 'dep-fence/conditions';

// Even for non-UI packages, discourage ../src references across packages (release quality)
export const policies: Policy[] = [
  {
    id: 'non-ui-paths-hygiene',
    when: isPublishable(),
    because: 'Avoid direct ../src references into other packages to keep release artifacts stable.',
    rules: ['paths-direct-src'],
  },
];

// Guidance
// OK:  Cross-package imports use published entry points or dist/*.d.ts, not ../src.
// NG:  tsconfig paths or source imports reach into another package\'s ../src directory.


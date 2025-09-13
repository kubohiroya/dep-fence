// Ensure entry types point to dist/*.d.ts
import type { Policy } from 'dep-fence/types';
import { any, isPublishable } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'package-types-must-point-to-dist',
    when: any(isPublishable()),
    because: 'Expose declaration files from dist/*.d.ts to keep publish boundaries stable.',
    rules: ['package-types-dist'],
    options: {
      'package-types-dist': { requireDistForEntries: ['.', './ui', './worker'] }
    }
  }
];

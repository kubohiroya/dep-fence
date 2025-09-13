// Govern skipLibCheck usage and documentation
import type { Policy } from 'dep-fence/types';
import { hasSkipLibCheck } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'skipLibCheck-governance',
    when: hasSkipLibCheck(),
    because: 'skipLibCheck is technical debt; use only with explicit permission and a documented reason.',
    rules: ['skipLibCheck-not-allowed', 'skipLibCheck-no-reason'],
  },
];

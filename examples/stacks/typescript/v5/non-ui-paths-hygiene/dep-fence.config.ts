// TS paths hygiene for non-UI packages
import type { Policy } from 'dep-fence/types';
import { isPublishable } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'non-ui-paths-hygiene',
    when: isPublishable(),
    because: 'Avoid direct ../src references into other packages to keep release artifacts stable.',
    rules: ['paths-direct-src'],
  },
];

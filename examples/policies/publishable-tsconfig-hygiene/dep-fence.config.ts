import type { Policy } from 'dep-fence/types';
import { isPublishable } from 'dep-fence/conditions';

// Keep tsconfig healthy for publishable packages: extend repo base and avoid ../src path mapping
export const policies: Policy[] = [
  {
    id: 'publishable-tsconfig-hygiene',
    when: isPublishable(),
    because: 'Published packages should inherit repo baselines and avoid direct references into other packages\' src.',
    rules: ['tsconfig-no-base', 'paths-direct-src'],
  },
];

// Guidance
// OK:  tsconfig.json extends "../../tsconfig.base.json" and has no paths pointing to ../src of other packages.
// NG:  tsconfig.json does not extend the base, or paths include "../src/*" pointing into another package\'s sources.


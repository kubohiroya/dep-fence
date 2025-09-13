import type { Policy } from 'dep-fence/types';
import { isPublishable } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'maplibre-allowlist',
    when: isPublishable(),
    because: 'Only the designated wrapper package may depend on MapLibre stack (package.json only check).',
    rules: ['maplibre-allowlist'],
    options: {
      'maplibre-allowlist': {
        libs: ['maplibre-gl', '@vis.gl/react-maplibre'],
        allow: ['@hierarchidb/ui-map'],
      }
    }
  },
];


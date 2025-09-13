import type { Policy } from 'dep-fence/types';
import { isPublishable } from 'dep-fence/conditions';

// Encapsulate MapLibre stack: only the wrapper package may depend on maplibre directly
export const policies: Policy[] = [
  {
    id: 'maplibre-encapsulation',
    when: isPublishable(),
    because: 'Keep MapLibre integration isolated in a single wrapper (e.g., @hierarchidb/ui-map).',
    rules: ['maplibre-direct-dep'],
  },
];

// Guidance
// OK:  Only @hierarchidb/ui-map has dependencies/devDeps/peers on 'maplibre-gl' or '@vis.gl/react-maplibre'.
// NG:  Other packages list these MapLibre packages directly; they should depend on the wrapper package instead.


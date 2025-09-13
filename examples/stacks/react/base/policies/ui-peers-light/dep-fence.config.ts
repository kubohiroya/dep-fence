import type { Policy } from 'dep-fence/types';
import { all, isPublishable, isUI } from 'dep-fence/conditions';

// Lightweight UI peers policy: keep React/MUI/Emotion as peers; do not enforce bundler externals here.
export const policies: Policy[] = [
  {
    id: 'ui-peers-light',
    when: all(isUI(), isPublishable()),
    because: 'UI libraries should rely on host-provided singletons (React/MUI/Emotion) to avoid duplicate bundles.',
    rules: ['ui-in-deps', 'ui-missing-peer'],
    severityOverride: {
      'ui-in-deps': 'WARN',
      'ui-missing-peer': 'WARN',
    },
    // OK: React/MUI/Emotion are listed in peerDependencies (not dependencies).
    // NG: React/MUI/Emotion present in dependencies or missing from peerDependencies.
  },
];


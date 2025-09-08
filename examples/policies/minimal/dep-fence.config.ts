import { all, isPublishable, isUI, usesTsup } from 'dep-fence/conditions';
import type { Policy } from 'dep-fence/types';

export const policies: Policy[] = [
  // UI packages (publishable) should not bundle shared singletons (React/MUI/Emotion)
  {
    id: 'ui-externals-and-peers',
    when: all(isUI(), isPublishable()),
    because: 'Avoid bundling shared UI singletons; rely on host app peers.',
    rules: ['ui-in-deps', 'ui-missing-peer', 'peer-in-external'],
  },

  // When using tsup, peer deps should be external to avoid double-bundling
  {
    id: 'tsup-peer-hygiene',
    when: usesTsup(),
    because: 'Prevent double-bundling by aligning peers with tsup externals.',
    rules: ['peer-in-external', 'external-in-deps'],
  },
];


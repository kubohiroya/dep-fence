// React UI minimal policy set: UI peers + tsup externals hygiene
import { all, isPublishable, isUI, usesTsup } from 'dep-fence/conditions';
import type { Policy } from 'dep-fence/types';

// Minimal React UI policy: keep UI libs as peers and align bundler externals
export const policies: Policy[] = [
  {
    id: 'ui-externals-and-peers',
    when: all(isUI(), isPublishable()),
    because: 'Avoid bundling shared UI singletons; rely on host app peers.',
    rules: ['ui-peer-policy', 'peer-in-external'],
  },
  {
    id: 'tsup-peer-hygiene',
    when: usesTsup(),
    because: 'Prevent double-bundling by aligning peers with bundler externals.',
    rules: ['peer-in-external', 'external-in-deps'],
  },
];

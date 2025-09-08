import { all, any, isPublishable, isUI, usesTsup } from 'dep-fence/conditions';
import type { Policy } from 'dep-fence/types';

export const policies: Policy[] = [
  {
    id: 'ui-externals-and-peers-strict',
    when: all(isUI(), isPublishable()),
    because: 'UI must rely on host peers; bundling shared singletons is forbidden.',
    rules: ['ui-in-deps', 'ui-missing-peer', 'peer-in-external'],
    severityOverride: {
      'ui-in-deps': 'ERROR',
      'ui-missing-peer': 'ERROR',
    },
  },
  {
    id: 'tsup-peer-hygiene',
    when: usesTsup(),
    because: 'Peers must be external when bundling with tsup.',
    rules: ['peer-in-external', 'external-in-deps'],
  },
  {
    id: 'tsconfig-hygiene',
    when: any(isPublishable()),
    because: 'Publishable packages should follow repo TS baselines and avoid ../src.',
    rules: ['tsconfig-no-base', 'paths-direct-src'],
  },
];


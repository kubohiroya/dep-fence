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
    // OK: UI package has React/MUI only in peerDependencies; tsup marks them external; build output does not contain them.
    // NG: UI package adds React/MUI to dependencies to fix a local build; this will be flagged as ERROR in CI.
  },
  {
    id: 'tsup-peer-hygiene',
    when: usesTsup(),
    because: 'Peers must be external when bundling with tsup.',
    rules: ['peer-in-external', 'external-in-deps'],
    // OK: Every peer is also in tsup.external and not duplicated in dependencies.
    // NG: A peer is missing from tsup.external (may get bundled) or an external also appears in dependencies.
  },
  {
    id: 'tsconfig-hygiene',
    when: any(isPublishable()),
    because: 'Publishable packages should follow repo TS baselines and avoid ../src.',
    rules: ['tsconfig-no-base', 'paths-direct-src'],
    // OK: tsconfig extends the repo base (e.g., tsconfig.base.json), and paths do not point into ../src of other packages.
    // NG: tsconfig does not extend the base, or paths include '../src/*' linking directly to source of other packages.
  },
];

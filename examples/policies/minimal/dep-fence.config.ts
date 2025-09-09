import { all, isPublishable, isUI, usesTsup } from 'dep-fence/conditions';
import type { Policy } from 'dep-fence/types';

export const policies: Policy[] = [
  // UI packages (publishable) should not bundle shared singletons (React/MUI/Emotion)
  {
    id: 'ui-externals-and-peers',
    when: all(isUI(), isPublishable()),
    because: 'Avoid bundling shared UI singletons; rely on host app peers.',
    rules: ['ui-in-deps', 'ui-missing-peer', 'peer-in-external'],
    // OK: @your/ui-button lists react in peerDependencies and excludes it via tsup.external.
    // NG: @your/ui-button lists react in dependencies (bundled) or forgets to externalize it.
    // Why: UI frameworks must be singletons provided by the app to avoid duplicate React/MUI copies.
  },

  // When using tsup, peer deps should be external to avoid double-bundling
  {
    id: 'tsup-peer-hygiene',
    when: usesTsup(),
    because: 'Prevent double-bundling by aligning peers with tsup externals.',
    rules: ['peer-in-external', 'external-in-deps'],
    // OK: Package has "react" in peerDependencies and tsup.external includes "react"; not present in dependencies.
    // NG: tsup.external includes "react" but package.json also lists "react" in dependencies (duplicate intent),
    //     or peerDependencies includes "react" but tsup.external omits it (risk of bundling peers).
  },
];

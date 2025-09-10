// Example: enforce UI libs as peers and align tsup externals
import type { Rule } from '../../src/guards/types';
import { pkgUiPeersRule } from '../../src/guards/index';

const rules: Rule[] = [
  pkgUiPeersRule({
    exclude: ['@your/app'], // host app may own React/MUI/Emotion
    severity: {
      uiInDeps: 'error',
      uiMissingPeer: 'warn',
      peerNotExternal: 'warn',
      externalInDeps: 'warn',
    },
  }),
];

export default rules;


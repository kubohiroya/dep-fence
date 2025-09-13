// Guards: strict UI peers + externals alignment
import type { Rule } from '../../src/guards/types';
import { pkgUiPeersRule } from '../../src/guards/index';

const rules: Rule[] = [
  pkgUiPeersRule({
    exclude: ['@your/app'],
    severity: {
      uiInDeps: 'error',
      uiMissingPeer: 'error',
      peerNotExternal: 'error',
      externalInDeps: 'warn',
    },
  }),
];

export default rules;


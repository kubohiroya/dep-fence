// Guards: UI peer policy — package.json-only peers hygiene
import type { Rule } from '../../src/guards/types';
import { pkgUiPeersRule } from '../../src/guards/index';

const rules: Rule[] = [
  pkgUiPeersRule({
    exclude: ['@your/app'],
    severity: {
      uiInDeps: 'error',
      uiMissingPeer: 'warn',
      peerNotExternal: 'warn',
      externalInDeps: 'warn',
    },
  }),
];

export default rules;


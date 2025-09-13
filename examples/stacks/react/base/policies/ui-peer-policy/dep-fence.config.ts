import type { Policy } from 'dep-fence/types';
import { all, isPublishable, isUI } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'ui-peer-policy',
    when: all(isUI(), isPublishable()),
    because: 'UI libraries should keep React/MUI/Emotion as peers (package.json only check).',
    rules: ['ui-peer-policy'],
    options: {
      'ui-peer-policy': {
        libs: ['react', 'react-dom', '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
        forbidInDeps: true,
        requireInPeers: true,
      }
    }
  },
];


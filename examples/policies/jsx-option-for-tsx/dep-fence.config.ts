import type { Policy } from 'dep-fence/types';
import { all, isPublishable, isUI } from 'dep-fence/conditions';

// TSX requires tsconfig compilerOptions.jsx set to 'react-jsx' for consistent emit and inference
export const policies: Policy[] = [
  {
    id: 'jsx-option-for-tsx',
    when: all(isPublishable(), isUI()),
    because: 'UI packages with TSX should use jsx: react-jsx for predictable builds and proper type inference.',
    rules: ['jsx-mismatch'],
  },
];

// Guidance
// OK:  tsconfig.compilerOptions.jsx = "react-jsx" while TSX files exist in src.
// NG:  TSX files exist but jsx option is unset or set to another mode; a WARN finding will explain the mismatch.


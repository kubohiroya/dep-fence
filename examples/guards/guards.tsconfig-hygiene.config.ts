// Example: tsconfig hygiene — base extends, jsx option, skipLibCheck governance
import type { Rule } from '../../src/guards/types';
import { tsconfigHygieneRule } from '../../src/guards/index';

const rules: Rule[] = [
  tsconfigHygieneRule({
    roots: ['packages', 'app'],
    requireBaseExtends: true,
    jsxShouldBe: 'react-jsx',
    skipLibCheck: {
      allowedPackages: ['@your/temp-exception'],
      action: 'warn',
      requireReasonField: true,
    },
  }),
];

export default rules;


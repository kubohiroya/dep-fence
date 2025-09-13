// Guards: publishable tsconfig hygiene — require base extends and govern skipLibCheck
import type { Rule } from '../../src/guards/types';
import { tsconfigHygieneRule } from '../../src/guards/index';

const rules: Rule[] = [
  tsconfigHygieneRule({
    roots: ['packages', 'app'],
    requireBaseExtends: true,
    skipLibCheck: {
      allowedPackages: ['@your/temp-exception'],
      requireReasonField: true,
      action: 'warn',
    },
  }),
];

export default rules;


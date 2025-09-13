// Guards: jsx option for TSX — enforce jsx: react-jsx
import type { Rule } from '../../src/guards/types';
import { tsconfigHygieneRule } from '../../src/guards/index';

const rules: Rule[] = [
  tsconfigHygieneRule({
    roots: ['packages', 'app'],
    jsxShouldBe: 'react-jsx',
    action: 'error',
  }),
];

export default rules;


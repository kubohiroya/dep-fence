// Example: ensure package.json main/module/exports paths resolve to existing files
import type { Rule } from '../../src/guards/types';
import { pkgExportsExistRule } from '../../src/guards/index';

const rules: Rule[] = [
  pkgExportsExistRule({ roots: ['packages', 'app'], action: 'error' }),
];

export default rules;


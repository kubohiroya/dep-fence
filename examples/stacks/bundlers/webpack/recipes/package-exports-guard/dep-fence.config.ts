// Webpack recipe: re-export the core policy
import type { Policy } from 'dep-fence/types';
import { any, isPublishable } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'workers-js-only-exports-guard',
    when: any(isPublishable()),
    because: 'Worker subpaths should publish JS only; types come from the main API.',
    rules: ['package-exports-guard'],
    options: {
      'package-exports-guard': { subpathPattern: '^\\./workers/', forbidFields: ['types'] }
    }
  }
];

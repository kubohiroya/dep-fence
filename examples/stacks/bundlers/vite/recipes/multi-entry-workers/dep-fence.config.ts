// Vite recipe: re-export the core policy
import type { Policy } from 'dep-fence/types';
import { any, isPublishable, isMultiEntry, publishesWorkers } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'workers-js-only',
    when: any(isPublishable(), publishesWorkers()),
    because: 'Worker subpaths publish JS only; types are provided by the main API.',
    rules: ['package-exports-guard'],
    options: {
      'package-exports-guard': { subpathPattern: '^\\./workers/', forbidFields: ['types'] }
    }
  },
  {
    id: 'types-point-to-dist-for-entries',
    when: any(isPublishable(), isMultiEntry()),
    because: 'Keep declaration outputs stable by pointing entries to dist/*.d.ts.',
    rules: ['package-types-dist'],
    options: {
      'package-types-dist': { requireDistForEntries: ['.', './ui', './worker'] }
    }
  }
];

import type { Policy } from 'dep-fence/types';
import { any, isPublishable, isMultiEntry, publishesWorkers } from 'dep-fence/conditions';

// Multi-entry package pattern with worker subpaths: JS-only workers, types from dist
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

// Guidance
// OK (package.json exports):
//   ".":        { "types": "./dist/index.d.ts",  "default": "./dist/index.mjs" }
//   "./ui":     { "types": "./dist/ui.d.ts",     "default": "./dist/ui.mjs" }
//   "./worker": { "types": "./dist/worker.d.ts", "default": "./dist/worker.mjs" }
//   "./workers/my-worker": { "default": "./dist/workers/my-worker.mjs" }
//   // Explanation: multi-entry types come from dist; workers do not expose types.
// NG (package.json exports):
//   "./workers/my-worker": { "types": "./dist/workers/my-worker.d.ts", "default": "./dist/workers/my-worker.mjs" }
//   // Problem: worker subpaths should not publish their own types; use the main entry types instead.


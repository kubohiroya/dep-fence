import type { Policy } from 'dep-fence/types';
import { any, isPublishable } from 'dep-fence/conditions';

// Guard export subpaths (e.g., workers) to avoid exposing fields like "types"
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

// Guidance
// OK (package.json exports):
//   "./workers/my-worker": { "default": "./dist/workers/my-worker.mjs" }
//   // Explanation: No "types" field on worker subpaths; declaration types are exposed via the root entry.
// NG (package.json exports):
//   "./workers/my-worker": { "types": "./dist/workers/my-worker.d.ts", "default": "./dist/workers/my-worker.mjs" }
//   // Problem: Worker subpaths should not publish types directly; it fragments the public type surface.


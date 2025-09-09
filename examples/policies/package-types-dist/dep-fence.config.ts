import type { Policy } from 'dep-fence/types';
import { any, isPublishable } from 'dep-fence/conditions';

// Ensure types for entries (root/ui/worker) point to dist/*.d.ts
export const policies: Policy[] = [
  {
    id: 'package-types-must-point-to-dist',
    when: any(isPublishable()),
    because: 'Expose declaration files from dist/*.d.ts to keep publish boundaries stable.',
    rules: ['package-types-dist'],
    options: {
      'package-types-dist': { requireDistForEntries: ['.', './ui', './worker'] }
    }
  }
];

// Guidance
// OK (package.json):
//   "types": "./dist/index.d.ts"
//   "exports": {
//     ".": { "types": "./dist/index.d.ts", "default": "./dist/index.mjs" },
//     "./ui": { "types": "./dist/ui.d.ts", "default": "./dist/ui.mjs" },
//     "./worker": { "types": "./dist/worker.d.ts", "default": "./dist/worker.mjs" }
//   }
// NG (package.json):
//   "types": "./src/index.d.ts" // or exports[entry].types pointing to src
//   // Problem: Types must come from dist/*.d.ts to match the published build.


import type { Policy } from 'dep-fence/types';
import { any, isPublishable } from 'dep-fence/conditions';

// Enforce that tsconfig paths point to built .d.ts in dist, not raw ../src
export const policies: Policy[] = [
  {
    id: 'tsconfig-paths-enforce-dist-dts',
    when: any(isPublishable()),
    because: 'Ensure public type references resolve to dist/*.d.ts, avoiding raw source leakage.',
    rules: ['tsconfig-paths'],
    options: {
      'tsconfig-paths': {
        allowPattern: '.*/dist/.*\\.d\\.ts',
        forbidPattern: '\\../src'
      }
    }
  }
];

// Guidance
// OK:  paths: { "@your/pkg": ["./dist/index.d.ts"], "@your/pkg/ui": ["./dist/ui.d.ts"] }
//      Rationale: Consumers reference emitted declaration files only.
// NG:  paths: { "@your/pkg": ["../src/index.ts"], "@your/pkg/ui": ["../src/ui/index.ts"] }
//      Problem: Points into raw source of another package; breaks encapsulation and build boundaries.


import type { Policy } from './types';
import { all, any, hasSkipLibCheck, isPublishable, isUI, usesTsup } from './conditions';

// Default policy set with explanatory comments.
// Intent: Always explain why a rule applies by tying it to package attributes.
// Note: UI-specific constraints apply to publishable packages; private apps are out of scope.

export const defaultPolicies: Policy[] = [
  // UI packages should not bundle React/MUI; rely on the host app's singleton peers.
  {
    id: 'ui-externals-and-peers',
    // Apply only to publishable UI packages (apps typically excluded).
    when: all(isUI(), isPublishable()),
    because: 'UI libraries should rely on host-provided singletons and avoid bundling shared frameworks.',
    rules: [
      // Package.json-only peer checks via plugin
      'ui-peer-policy',
      // Ensure peers are externalized in bundling tools
      'peer-in-external',
    ],
  },

  // When using tsup, make peers external to prevent double-bundling.
  {
    id: 'tsup-peer-hygiene',
    when: usesTsup(),
    because: 'Packages bundled with tsup should externalize peers to avoid duplicate bundles.',
    rules: [
      'peer-in-external',
      // If something is marked external but also appears in dependencies, suggest moving it to peers.
      'external-in-deps',
    ],
  },

  // Publishable TS hygiene: extend the repo base and avoid ../src path mapping.
  {
    id: 'publishable-tsconfig-hygiene',
    when: isPublishable(),
    because: 'Published packages should inherit the repo tsconfig and avoid direct ../src cross-links.',
    rules: [
      'tsconfig-no-base',
      'paths-direct-src',
    ],
  },

  // Discourage long-lived local declaration shims (*.d.ts) in publishable packages.
  {
    id: 'publishable-local-shims',
    when: isPublishable(),
    because: 'Avoid normalizing local shims that mask type issues; prefer fixing at the source.',
    rules: ['local-shims'],
    // Start as WARN; can be raised to ERROR later.
    severityOverride: { 'local-shims': 'WARN' },
  },

  // If TSX is present, enforce jsx: react-jsx for predictable emit/inference.
  {
    id: 'jsx-option-for-tsx',
    when: all(isPublishable(), isUI()),
    because: 'Enforce jsx: react-jsx for TSX to align emit and type inference.',
    rules: ['jsx-mismatch'],
  },

  // Govern skipLibCheck (prefer disabled; require explicit reason or allowlist when enabled).
  {
    id: 'skipLibCheck-governance',
    when: hasSkipLibCheck(),
    because: 'skipLibCheck is technical debt; require an explicit reason or repo-level allowlist.',
    rules: [
      'skipLibCheck-not-allowed',
      'skipLibCheck-no-reason',
    ],
  },

  // For non-UI packages, discourage ../src direct references to preserve release quality.
  {
    id: 'non-ui-paths-hygiene',
    when: any(isPublishable()),
    because: 'Keep artifacts stable by avoiding direct ../src links into other packages.',
    rules: ['paths-direct-src'],
  },

  // MapLibre encapsulation: only the designated wrapper should depend on maplibre libs.
  {
    id: 'maplibre-encapsulation',
    when: any(isPublishable()),
    because: 'Isolate MapLibre differences inside the wrapper package and avoid leaking dependencies downstream.',
    rules: ['maplibre-allowlist'],
    options: { 'maplibre-allowlist': { allow: ['@hierarchidb/ui-map'] } },
  },
];

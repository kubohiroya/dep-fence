# dep-fence 🧱✨
[![npm version](https://img.shields.io/npm/v/dep-fence?style=flat-square)](https://www.npmjs.com/package/dep-fence)
[![license](https://img.shields.io/npm/l/dep-fence?style=flat-square)]


Policy‑first dependency and TypeScript hygiene for monorepos — with reasons. Every finding explains why the rule applies, so reviews stay focused and predictable. 🚥

## What & Why

- What it is: A lightweight, policy‑driven guardrail for repository‑wide dependency boundaries. It detects boundary crossings and can fail CI. Typical use: enforce public‑API‑only imports, keep UI/domain layers separate, align peerDependencies with bundler externals, keep tsconfig sane, and govern skipLibCheck — always with an explicit “Because: …”.
- Problems it solves: deep import leaks, accidental cross‑package coupling in monorepos, type/exports drift that breaks publishing, peer vs bundler external mismatches, JSX option inconsistencies, and more.
- How it compares and when to use which:
  - [ESLint](https://eslint.org): great for per‑file AST/style rules. Keep ESLint for in‑file concerns; use dep‑fence for cross‑file/package dependency edges and architectural layers.
  - [madge](https://github.com/pahen/madge) / [dependency‑cruiser](https://github.com/sverweij/dependency-cruiser): excellent for graph visualization and flexible analysis. Use those for exploration/complex graph rules; use dep‑fence for an opinionated, CI‑first, monorepo‑friendly policy engine with simple allow/forbid semantics.
  - [syncpack](https://github.com/JamieMason/syncpack): keeps versions and workspace ranges tidy in package.json. Use syncpack for manifest hygiene; use dep‑fence for runtime/build‑time import and peer/bundler alignment.
  - [publint](https://publint.dev): validates the shape of published packages. publint protects consumers; dep‑fence keeps your source respecting boundaries before you publish.

## Why dep‑fence? ✨
- Condition‑driven rules (e.g., apply only to packages that are UI + publishable).
- Prevent double‑bundling by aligning tsup `external` with `peerDependencies`. 📦➕📦❌
- Govern `skipLibCheck` with explicit reasons or an allow‑list. ⚖️
- Keep `tsconfig` healthy (baseline inheritance, forbid `../src` direct references, JSX option sanity).
- Every message includes “Because: …”, making policy intent visible. 🗣️

## Install 📦

Local (recommended):

```bash
pnpm add -D dep-fence
# or
npm i -D dep-fence
```

Global:

```bash
npm i -g dep-fence
```

Requirement: Node.js >= 18

## CLI Usage 🖥️

```bash
dep-fence            # pretty report
dep-fence --json     # JSON output
dep-fence --strict   # exit 1 if any ERROR
dep-fence --config path/to/dep-fence.config.ts  # explicit policy file (TS/JS supported)
```

Example (gate in CI):

```jsonc
// package.json
{
  "scripts": {
    "dep-fence": "dep-fence --strict"
  }
}
```

Human‑readable output:

```
=== @your/ui-button ===
ERROR ui-in-deps: UI libs should be peerDependencies (not dependencies):
- react
Because: UI packages should not bundle React/MUI; rely on host peers.
```

JSON:

```bash
dep-fence --json | jq
```

Exit code: only with `--strict`, returns 1 when any ERROR exists.

## Zero‑Config Mode 🚀

You can run dep‑fence with zero configuration in a typical monorepo:

- Auto‑detects repo root via nearest `pnpm-workspace.yaml` or `package.json`.
- Scans packages under `packages/*/**/package.json` and `app/package.json` (if present).
- Applies sensible default policies that cover UI/peer/tsup alignment, `tsconfig` hygiene, and `skipLibCheck` governance.
- No `dep-fence.config.*` required to get value on day one.

Why this matters (concrete benefits):
- Instant adoption: drop into CI and get actionable findings without setup.
- Predictable baselines: the same defaults across repos reduce bikeshedding.
- Safe by default: read‑only checks; use `--strict` to fail on ERRORs when ready.
- Incremental rollout: start as a linter, then codify exceptions as you learn.
- Reviewer‑friendly: every finding says “Because: …” to explain the policy.

## Quick Start 🚀

### TS (typed, recommended) and MJS (zero‑setup)

After adding a minimal config, run `pnpm dep-fence`. TS first, then MJS.

TS: `dep-fence.config.ts`

```ts
import { defaultPolicies } from 'dep-fence';
import type { Policy } from 'dep-fence/types';

const custom: Policy[] = [
  { id: 'ban-deep-imports', when: () => true, because: 'Use public API only; avoid cross‑package internals.', rules: [
    { rule: 'import-path-ban', options: { forbid: ['^@[^/]+/[^/]+/src/'] }, severity: 'ERROR' },
  ]},
];

export const policies: Policy[] = [...defaultPolicies, ...custom];
```

MJS: `dep-fence.config.mjs`

```mjs
import { defaultPolicies } from 'dep-fence';
/** @type {import('dep-fence/types').Policy[]} */
export const policies = [
  ...defaultPolicies,
  { id: 'ban-deep-imports', when: () => true, because: 'Use public API only; avoid cross‑package internals.', rules: [
    { rule: 'import-path-ban', options: { forbid: ['^@[^/]+/[^/]+/src/'] }, severity: 'ERROR' },
  ]},
];
```

Commands and expected output:

```bash
pnpm dep-fence
pnpm dep-fence --strict  # CI gate (exit 1 on ERROR)
```

Success: `✔ No violations (0)`

Violation (example):

```
=== @your/ui-button ===
ERROR ui-in-deps: UI libs should be peerDependencies (not dependencies):
- react
Because: UI packages should not bundle React/MUI; rely on host peers.
```

## Representative Policy Examples (Purpose / Snippet / Outcome)

- Public API only (ban deep imports across packages)
  - Purpose: `@org/foo` is OK; `@org/foo/src/x` is not.
  - Snippet:
    ```ts
    { id: 'public-api-only', when: () => true, because: 'Only use package public entrypoints.', rules: [
      { rule: 'import-path-ban', options: { forbid: ['^@[^/]+/[^/]+/src/'] }, severity: 'ERROR' },
    ]}
    ```
  - Outcome: Detects cross‑package references into `src/`.

- Peers × tsup externals alignment
  - Purpose: ensure peers are treated as externals by the bundler.
  - Snippet:
    ```ts
    { id: 'tsup-peer-hygiene', when: isPublishable(), because: "Don't bundle peers.", rules: ['peer-in-external','external-in-deps'] }
    ```
  - Outcome: Flags peers missing in `tsup.external` or duplicated in `dependencies`.

- Enforce types from dist
  - Purpose: published types should come from `dist/*.d.ts`.
  - Snippet:
    ```ts
    { id: 'package-types-dist', when: isPublishable(), because: 'Expose types from dist/*.d.ts.', rules: ['package-types-dist'] }
    ```
  - Outcome: Violates when `types` or `exports[entry].types` do not point to `dist/*.d.ts`.

## What It Detects (Conceptual Summary)

- Terms: Policy (target selection + Because + rules), Rule (individual check), Finding (INFO/WARN/ERROR).
- Flow: infer package attributes → choose applicable policies → run rules → emit findings with Because.

## Best Practices

- Start with “ban deep imports” and “peers × bundler external alignment”.
- Keep exceptions justified with Because; introduce via `severityOverride` (WARN → ERROR) for gradual rollout.
- Use `--strict` in CI; run without it locally for discovery.

## Advanced Settings

### Config format choice (TS or MJS)

- Supported: `dep-fence.config.ts`, `dep-fence.config.mjs` (ESM `.mjs` preferred over `.js`).
- Recommendation: prefer `.mjs` for zero‑setup CI/offline; prefer `.ts` for editor type‑safety.
- Running `.ts` configs:
  1) Built‑in fallback (no extra deps): strips type‑only syntax and evaluates at runtime.
  2) Loader (e.g., `tsx`): `NODE_OPTIONS="--loader tsx" pnpm dep-fence`.
  3) Prebuild (e.g., `tsup`): `tsup dep-fence.config.ts --format esm --dts false --out-dir .`.
- Pitfalls: require Node ≥ 18 with ESM, avoid mixing CJS/ESM, minimize runtime deps in air‑gapped CI.

### Performance and caching
- Prefer fewer, broader rules to many tiny ones.
- In CI, scope checks to changed packages where possible.

### Workspace/subtree overrides
- Typical setup is a single root config; split into modules or swap via `DEP_FENCE_CONFIG` for subtrees/teams if needed.

## Advanced Policy Configuration 🛠️

Zero‑config works out of the box. When you need more control, provide an explicit policy file (`dep-fence.config.ts` or `dep-fence.config.mjs`) at the repo root to replace the defaults.

Policy file (TypeScript example):

```ts
// dep-fence.config.ts
import { all, isUI, isPublishable } from 'dep-fence/conditions';
import type { Policy } from 'dep-fence/types';

export const policies: Policy[] = [
  {
    id: 'ui-externals-and-peers',
    when: all(isUI(), isPublishable()),
    because: 'UI packages should not bundle React/MUI; rely on peers.',
    rules: ['ui-in-deps', 'ui-missing-peer', 'peer-in-external']
  }
];
```

You can also tweak severity per rule via `severityOverride` and compose complex conditions with `all(...)`, `any(...)`, and `not(...)`. Helpers like `isUI()`, `isPublishable()`, and `usesTsup()` are available from `dep-fence/conditions`.

Repo‑wide operational settings (JSON) can be declared in `dep-fence.config.json`:

```jsonc
{
  "allowSkipLibCheck": [
    "@your/legacy-chart" // temporary exception
  ]
}
```

Per‑package justification for `skipLibCheck` can live in each `tsconfig.json`:

```jsonc
{
  "compilerOptions": { "skipLibCheck": true },
  "checkDeps": {
    "allowSkipLibCheck": true,
    "reason": "3rd‑party types temporary mismatch; scheduled fix"
  }
}
```

Environment variables:
- `DEP_FENCE_CONFIG` — absolute/relative path to a policies module (overrides file discovery).
- `DEP_FENCE_REPO_CONFIG` — path to a JSON file with repo‑wide settings (overrides `dep-fence.config.json`).

## Examples 📁

The [`examples/`](./examples/) directory contains copy‑pasteable configurations, each with inline OK/NG guidance explaining why they pass/fail:


- Minimal and strict UI
  - `examples/policies/minimal/dep-fence.config.ts` — small, readable defaults.
  - `examples/policies/strict-ui/dep-fence.config.ts` — stricter UI rules with severity overrides.
- Focused policies
  - `examples/policies/source-import-ban/dep-fence.config.ts` — ban specific named imports.
  - `examples/policies/tsconfig-paths/dep-fence.config.ts` — enforce dist/*.d.ts; forbid ../src in paths.
  - `examples/policies/publishable-tsconfig-hygiene/dep-fence.config.ts` — require base tsconfig + forbid ../src.
  - `examples/policies/publishable-local-shims/dep-fence.config.ts` — discourage long‑lived local *.d.ts shims.
  - `examples/policies/jsx-option-for-tsx/dep-fence.config.ts` — enforce jsx: react‑jsx for TSX.
  - `examples/policies/skiplibcheck-governance/dep-fence.config.ts` — govern skipLibCheck usage.
  - `examples/policies/non-ui-paths-hygiene/dep-fence.config.ts` — discourage ../src across the board.
  - `examples/policies/maplibre-encapsulation/dep-fence.config.ts` — isolate MapLibre deps to a wrapper.
- Packaging patterns
  - `examples/policies/package-exports-guard/dep-fence.config.ts` — keep worker subpaths JS‑only.
  - `examples/policies/package-types-dist/dep-fence.config.ts` — entries must point types to dist/*.d.ts.
  - `examples/policies/multi-entry-workers/dep-fence.config.ts` — combined multi‑entry + workers.
- Extensibility
  - `examples/policies/custom-rule/dep-fence.config.ts` — minimal custom runtime rule.
- Repo‑wide settings and toolchain
  - `examples/repo-config/dep-fence.config.json` — repo‑wide settings (e.g., allowSkipLibCheck).
  - `examples/tsconfig/tsconfig.allow-skiplibcheck.json` — per‑package rationale for skipLibCheck.
  - `examples/tsup/tsup.base.config.ts` — central externals list for monorepos.

How to run an example (overrides config discovery):

```bash
# Minimal policy set
DEP_FENCE_CONFIG=examples/policies/minimal/dep-fence.config.ts pnpm dep-fence

# Focused examples
DEP_FENCE_CONFIG=examples/policies/tsconfig-paths/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_CONFIG=examples/policies/package-exports-guard/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_CONFIG=examples/policies/multi-entry-workers/dep-fence.config.ts pnpm dep-fence

# With repo‑wide JSON settings
DEP_FENCE_REPO_CONFIG=examples/repo-config/dep-fence.config.json pnpm dep-fence
```

## Troubleshooting

- False positives with path aliases: align dep‑fence’s resolver with your tsconfig `paths`/bundler aliases.
- Type‑only imports flagged: adjust rule targets/conditions or use rules that account for types‑only edges.
- Dynamic imports: dynamic/computed paths are treated conservatively; model critical boundaries with static paths.

## FAQ

- [ESLint](https://eslint.org) or dep‑fence?
  - Both. ESLint covers in‑file quality; dep‑fence enforces cross‑file/package boundaries.
- Why not just [dependency‑cruiser](https://github.com/sverweij/dependency-cruiser)?
  - It’s great for exploration/visualization. dep‑fence focuses on CI‑first, opinionated defaults for monorepos with a small set of high‑signal rules.
- How do we roll it out gradually?
  - Start with WARN and one or two forbid rules; raise to ERROR once violations are addressed.
- How to allow a temporary exception?
  - Use a narrowly scoped policy/condition or `severityOverride`, and record a Because reason.
- How to protect publish quality?
  - Pair dep‑fence (boundaries/types path/peer×bundler) with [publint](https://publint.dev) (package export surface) in CI.

## What it checks 🔍

- Peers × tsup externals
  - `peer-in-external` (peer missing from `tsup.external`)
  - `external-in-deps` (external also listed in `dependencies`)
- UI package hygiene
  - `ui-in-deps` (React/MUI/Emotion in `dependencies`)
  - `ui-missing-peer` (UI libs used but missing from `peerDependencies`)
- TypeScript hygiene
  - `tsconfig-no-base` (not extending repo base; hint)
  - `paths-direct-src` (direct `../src` references)
  - `jsx-mismatch` (.tsx present but `jsx` not `react-jsx`)
- `skipLibCheck` governance
  - `skipLibCheck-not-allowed` (enabled without permission)
  - `skipLibCheck-no-reason` (permitted but missing rationale)
- Encapsulation rules
  - `maplibre-direct-dep` (direct MapLibre deps outside the wrapper package)

All findings include “Because: …” to surface rationale.

### Default Policies (catalog) 📚

Each default policy explains why it applies (Because) and targets specific attributes:

- `ui-externals-and-peers` — UI packages must not bundle React/MUI; rely on peers. Rules: `ui-in-deps`, `ui-missing-peer`, `peer-in-external`.
- `tsup-peer-hygiene` — bundlers must externalize peers. Rules: `peer-in-external`, `external-in-deps`.
- `publishable-tsconfig-hygiene` — keep published `tsconfig` clean. Rules: `tsconfig-no-base`, `paths-direct-src`.
- `publishable-local-shims` — avoid long‑lived local `*.d.ts`. Rule: `local-shims` (default WARN; can be raised).
- `jsx-option-for-tsx` — TSX requires `jsx: react-jsx`. Rule: `jsx-mismatch`.
- `skipLibCheck-governance` — permissioned toggle with reasons. Rules: `skipLibCheck-*`.
- `non-ui-paths-hygiene` — discourage cross‑src refs broadly. Rule: `paths-direct-src`.
- `maplibre-encapsulation` — only wrapper package may depend on MapLibre. Rule: `maplibre-direct-dep`.

Severity override example:

```ts
export const policies = [
  {
    id: 'ui-externals-and-peers',
    when: all(isUI(), isPublishable()),
    because: '…',
    rules: ['ui-in-deps', 'ui-missing-peer', 'peer-in-external'],
    severityOverride: { 'ui-missing-peer': 'ERROR' }
  }
];
```

### Opt‑in Extensions (examples) 🧪

Additional rules and helpers can be enabled via a policy file:

- `source-import-ban` — ban specific named imports from a module. See `examples/policies/source-import-ban/dep-fence.config.ts`.
- `tsconfig-paths` — enforce `paths` to point to `dist/*.d.ts` and/or forbid patterns.
- `package-exports-guard` — guard subpaths (e.g., forbid `types` for `./workers/*`).
- `package-types-dist` — ensure package `types` and `exports[entry].types` point to `dist/*.d.ts`.

### Advanced: Custom Runtime Rules 🧩

You can register custom runtime checks directly in a policy (see example below). For configuration format and loader choices, see “Advanced Settings”.

```ts
import type { Policy } from 'dep-fence/types';

export const policies: Policy[] = [
  {
    id: 'my-custom-checks',
    when: isPublishable(),
    because: 'repo‑specific validation',
    rules: [{
      rule: 'custom',
      id: 'check-pkg-field',
      run: (ctx) => {
        const f = [] as any[];
        if (!ctx.pkgJson.customField) {
          f.push({ packageName: ctx.pkgName, packageDir: ctx.pkgDir, rule: 'check-pkg-field', severity: 'WARN', message: 'missing customField', because: ctx.because });
        }
        return f;
      }
    }]
  }
];
```

## How it works 🧭

- Detects repo root via `pnpm-workspace.yaml` or nearest `package.json`.
- Scans package directories:
  - `packages/*/**/package.json`
  - `app/package.json` (if present)
- Infers attributes: `ui`, `publishable/private`, `usesTsup`, `hasTsx`, `browser/node`, `worker`, `next`, `storybook`, `app`.
- Derives `tsup.external` from repo `tsup.base.config.*` and per‑package `tsup.config.*` when available.

## Programmatic API 🧩

```ts
import { runWithPolicies, defaultPolicies } from 'dep-fence';
import { any, isPublishable } from 'dep-fence/conditions';

const findings = runWithPolicies(defaultPolicies);
const hasError = findings.some((f) => f.severity === 'ERROR');
```

Types are available from `dep-fence/types` (`Finding`, `Policy`, `Condition`, `Severity`, ...).

## CI Integration 🛡️

```yaml
# GitHub Actions example
jobs:
  dep-fence:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm i --frozen-lockfile
      - run: pnpm dep-fence  # refer to your package.json script
```






## Author

Hiroya Kubo hiroya@cuc.ac.jp

## License 📄

MIT

---

Happy fencing! 🧱✨ Add reasons to rules and keep dependencies sane.

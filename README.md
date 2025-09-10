# dep-fence 🧱✨
[![npm version](https://img.shields.io/npm/v/dep-fence?style=flat-square)](https://www.npmjs.com/package/dep-fence)
[![license](https://img.shields.io/npm/l/dep-fence?style=flat-square)]


Policy‑first dependency and TypeScript hygiene for monorepos — with reasons. Every finding explains why the rule applies, so reviews stay focused and predictable. 🚥

## Table of Contents 🧭

- [What, Why & How 💡](#what-why--how-)
- [Install 📦](#install-)
- [Getting Started 🛣️](#getting-started-)
- [Basic Usage 🖥️](#basic-usage-)
- [Advanced Usage 💪](#advanced-usage-)
- [Policy Configuration 🛠️](#policy-configuration-)
- [Git Integration: pre‑commit / pre‑push 🐙](#git-integration-precommit--prepush-)
- [CI Integration 🛡️](#ci-integration-)
- [Examples 📁](#examples-)
- [What It Checks 🔍](#what-it-checks-)
- [Programmatic API 🧩](#programmatic-api-)
- [Best Practices ✅](#best-practices-)
- [Troubleshooting 🆘](#troubleshooting-)
- [FAQ ❓](#faq-)
- [Author ✍️](#author-)
- [License 📄](#license-)

## What, Why & How 💡

- What it is: A lightweight, policy‑driven guardrail for repository‑wide dependency boundaries. It detects boundary crossings and can fail CI. Typical use: enforce public‑API‑only imports, keep UI/domain layers separate, align peerDependencies with bundler externals, keep tsconfig sane, and govern skipLibCheck — always with an explicit “Because: …”.
- Problems it solves: deep import leaks, accidental cross‑package coupling in monorepos, type/exports drift that breaks publishing, peer vs bundler external mismatches, JSX option inconsistencies, and more.
- How it compares and when to use which:
  - [ESLint](https://eslint.org): great for per‑file AST/style rules. Keep ESLint for in‑file concerns; use dep‑fence for cross‑file/package dependency edges and architectural layers.
  - [madge](https://github.com/pahen/madge) / [dependency‑cruiser](https://github.com/sverweij/dependency-cruiser): excellent for graph visualization and flexible analysis. Use those for exploration/complex graph rules; use dep‑fence for an opinionated, CI‑first, monorepo‑friendly policy engine with simple allow/forbid semantics.
  - [syncpack](https://github.com/JamieMason/syncpack): keeps versions and workspace ranges tidy in package.json. Use syncpack for manifest hygiene; use dep‑fence for runtime/build‑time import and peer/bundler alignment.
  - [publint](https://publint.dev): validates the shape of published packages. publint protects consumers; dep‑fence keeps your source respecting boundaries before you publish.

### Why dep‑fence? ✨
- Condition‑driven rules (e.g., apply only to packages that are UI + publishable).
- Prevent double‑bundling by aligning tsup `external` with `peerDependencies`. 📦➕📦❌
- Govern `skipLibCheck` with explicit reasons or an allow‑list. ⚖️
- Keep `tsconfig` healthy (baseline inheritance, forbid `../src` direct references, JSX option sanity).
- Every message includes “Because: …”, making policy intent visible. 🗣️

> This complements existing tools — use with [dependency‑cruiser](https://github.com/sverweij/dependency-cruiser) / [ESLint](https://eslint.org) / [syncpack](https://github.com/JamieMason/syncpack) / [publint](https://publint.dev).


### How it works? 🧭

- Detects repo root via `pnpm-workspace.yaml` or nearest `package.json`.
- Scans package directories:
    - `packages/*/**/package.json`
    - `app/package.json` (if present)
- Infers attributes: `ui`, `publishable/private`, `usesTsup`, `hasTsx`, `browser/node`, `worker`, `next`, `storybook`, `app`.
- Derives `tsup.external` from repo `tsup.base.config.*` and per‑package `tsup.config.*` when available.


---
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

---
## Getting Started 🛣️
### CLI Usage

```bash
dep-fence                    # YAML output (default)
dep-fence --format pretty    # human‑readable (pretty)
dep-fence --format yaml      # YAML explicitly
dep-fence -f yaml -g severity  # group by ERROR/WARN/INFO
dep-fence -f json            # JSON output
dep-fence --strict           # exit 1 if any ERROR
dep-fence -c path/to/dep-fence.config.ts  # explicit policy file (TS/JS supported)
dep-fence -h                 # help
dep-fence -v                 # version
```

### Output Formats

- Default: YAML grouped by package (equivalent to `--format yaml --group-by package`).
- Pretty: `--format pretty` for human‑readable, package‑grouped output.
- JSON: `--format json` for machine‑readable output.
- YAML grouping: `--group-by <package|rule|severity>` only affects YAML.
  - Examples:
    - `dep-fence --format yaml --group-by rule`
    - `dep-fence --format yaml --group-by severity`

Short flags: `-f` = `--format`, `-g` = `--group-by`, `-c` = `--config`.

Note: the legacy `--json` flag was removed; use `--format json`.


### Commands and expected output:

```bash
pnpm dep-fence
pnpm dep-fence --strict  # CI gate (exit 1 on ERROR)
```

Success Output
```
✔ No violations (0)
```

Violation Output in YAML format (default):

```yaml
"@your/ui-button":
  - type: ui-in-deps
    severity: ERROR
    message: |
      UI libs should be peerDependencies (not dependencies):
      - react
    reason: UI packages should not bundle React/MUI; rely on host peers.
```

Violation Output in pretty format (with `--format pretty` option):

```
=== @your/ui-button ===
ERROR ui-in-deps: UI libs should be peerDependencies (not dependencies):
- react
Because: UI packages should not bundle React/MUI; rely on host peers.
```


### Zero‑Config Mode 🚀

Zero‑Config Mode runs the default package policies (package‑level checks) in a typical monorepo:

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

---

## Basic Usage 🖥️

### Save a report for review (grouped by severity)

```bash
dep-fence -f yaml -g severity > dep-fence.report.yaml
```

This helps leads/owners scan ERRORs vs WARNs separately and share the file in reviews.

### Extract error summaries in CI logs (JSON → jq)

```bash
dep-fence -f json | jq -r '.findings[] | select(.severity=="ERROR") | "[\(.severity)] \(.packageName) :: \(.rule)"'
```

This prints concise error lines like: `[ERROR] @your/ui-button :: ui-in-deps`.


---
## Advanced Usage 💪

## Policy Configuration 🛠️

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

### Policies by Example

Representative Policy Examples (Purpose / Snippet / Outcome)

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


### Select Pre-Defined Config Files

You can import pre-defined config files in the exmaple directory with `--config` option as you needed.
Plsease consult `examples/policies/` directory of this repository for more details.

### Create Your Original Config Files

You can create your own config files to customize the rules and settings.

Simple example 1:
```ts
import type { Policy } from 'dep-fence/types';
import { defaultPolicies } from 'dep-fence';
import { pkgUiPeersRule, pkgExportsExistRule, tsconfigHygieneRule } from 'dep-fence/guards';

const custon: Policy[] = [
  pkgUiPeersRule({ exclude: ['@your/app'] }),
  pkgExportsExistRule({ roots: ['packages', 'app'] }),
  tsconfigHygieneRule({
    skipLibCheck: { allowedPackages: ['@your/temp-exception'], requireReasonField: true, action: 'warn' },
  }),
];

const policies: Policy[] = [...defaultPolicies, ...custom];
export default policies;
```

Simple example 2:
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


### Create Your Own Policies from Scratch with TS (typed, recommended) or MJS (zero‑setup)

Config format choice (TS or MJS)

- Supported: `dep-fence.config.ts`, `dep-fence.config.mjs` (ESM `.mjs` preferred over `.js`).
- Recommendation: prefer `.mjs` for zero‑setup CI/offline; prefer `.ts` for editor type‑safety.
- Running `.ts` configs:
    1) Built‑in fallback (no extra deps): strips type‑only syntax and evaluates at runtime.
    2) Loader (e.g., `tsx`): `NODE_OPTIONS="--loader tsx" pnpm dep-fence`.
    3) Prebuild (e.g., `tsup`): `tsup dep-fence.config.ts --format esm --dts false --out-dir .`.
- Pitfalls: require Node ≥ 18 with ESM, avoid mixing CJS/ESM, minimize runtime deps in air‑gapped CI.

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

```js
import { defaultPolicies } from 'dep-fence';
/** @type {import('dep-fence/types').Policy[]} */
export const policies = [
  ...defaultPolicies,
  { id: 'ban-deep-imports', when: () => true, because: 'Use public API only; avoid cross‑package internals.', rules: [
    { rule: 'import-path-ban', options: { forbid: ['^@[^/]+/[^/]+/src/'] }, severity: 'ERROR' },
  ]},
];
```



### Environment variables:
- `DEP_FENCE_CONFIG` — absolute/relative path to a policies module (overrides file discovery).
- `DEP_FENCE_REPO_CONFIG` — path to a JSON file with repo‑wide settings (overrides `dep-fence.config.json`).

### Workspace/subtree overrides
- Typical setup is a single root config; split into modules or swap via `DEP_FENCE_CONFIG` for subtrees/teams if needed.

### Performance and caching
- Prefer fewer, broader rules to many tiny ones.
- In CI, scope checks to changed packages where possible.



---
## Git Integration: pre‑commit / pre‑push 🐙

Alongside package policies (see Zero‑Config Mode), dep‑fence ships lightweight repository‑level guards under the `dep-fence/guards` entry. They are designed for Git hooks (predictable, no hidden state):

- `allowed-dirs` — Commit scope guard: staged files must be under allowed globs.
- `mtime-compare` — Advisory: detect files newer than your rules/SSOT baseline.
- `upstream-conflict` — Optimistic conflict detection: fail if upstream has other‑author changes touching protected paths since your base.

New guards for monorepo publishing/build hygiene:
- `pkg-exports-exist` — Verify package.json main/module/exports paths point to existing files (prevents publish/bundler breakage).
- `pkg-ui-peers` — Enforce UI singletons as peers and align bundler externals (flags: ui-in-deps, ui-missing-peer, peer-in-external, external-in-deps).
- `tsconfig-hygiene` — Keep tsconfig healthy (extends repo base, jsx option sanity, skipLibCheck governance with allowlist/justification).

Try the examples:

```bash
pnpm dlx tsx examples/guards/run.ts --mode pre-commit
pnpm dlx tsx examples/guards/run.ts --mode pre-push

pnpm dlx tsx examples/guards/run.ts --mode pre-commit \
  --config examples/guards/guards.ui-peers.config.ts

pnpm dlx tsx examples/guards/run.ts --mode pre-commit \
  --config examples/guards/guards.pkg-exports.config.ts

pnpm dlx tsx examples/guards/run.ts --mode pre-commit \
  --config examples/guards/guards.tsconfig-hygiene.config.ts
```

---
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

---
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

---
## What It Checks 🔍

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


## Programmatic API 🧩

```ts
import { runWithPolicies, defaultPolicies } from 'dep-fence';
import { any, isPublishable } from 'dep-fence/conditions';

const findings = runWithPolicies(defaultPolicies);
const hasError = findings.some((f) => f.severity === 'ERROR');
```

Types are available from `dep-fence/types` (`Finding`, `Policy`, `Condition`, `Severity`, ...).


## Best Practices ✅

- Start with “ban deep imports” and “peers × bundler external alignment”.
- Keep exceptions justified with Because; introduce via `severityOverride` (WARN → ERROR) for gradual rollout.
- Use `--strict` in CI; run without it locally for discovery.

## Troubleshooting 🆘

- False positives with path aliases: align dep‑fence’s resolver with your tsconfig `paths`/bundler aliases.
- Type‑only imports flagged: adjust rule targets/conditions or use rules that account for types‑only edges.
- Dynamic imports: dynamic/computed paths are treated conservatively; model critical boundaries with static paths.

## FAQ ❓

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

## Author ✍️

Hiroya Kubo hiroya@cuc.ac.jp

## License 📄

MIT

---

Happy fencing! 🧱✨ Add reasons to rules and keep dependencies sane.

# dep-fence 🧱

Policy‑first dependency and TypeScript hygiene for monorepos — with reasons. Every finding explains why the rule applies, so reviews stay focused and predictable. 🚥

## Why dep‑fence? ✨
- Condition‑driven rules (e.g., apply only to packages that are UI + publishable).
- Prevent double‑bundling by aligning tsup `external` with `peerDependencies`. 📦➕📦❌
- Govern `skipLibCheck` with explicit reasons or an allow‑list. ⚖️
- Keep `tsconfig` healthy (baseline inheritance, forbid `../src` direct references, JSX option sanity).
- Every message includes “Because: …”, making policy intent visible. 🗣️

> This complements existing tools — use with dependency‑cruiser / ESLint / syncpack / publint / @arethetypeswrong/cli.

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

## Advanced Policy Configuration 🛠️

Zero‑config works out of the box. When you need more control, provide an explicit policy file to replace the defaults.

Policy file (TypeScript, preferred): place `dep-fence.config.ts` at the repo root.

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

See the `examples/` directory for ready‑to‑copy templates:

- `examples/policies/minimal/dep-fence.config.ts` — small, readable policy set.
- `examples/policies/strict-ui/dep-fence.config.ts` — stricter UI policy with severity overrides.
- `examples/policies/source-import-ban/dep-fence.config.ts` — ban specific symbols from a package.
- `examples/repo-config/dep-fence.config.json` — repo‑wide settings (`allowSkipLibCheck`, etc.).
- `examples/tsconfig/tsconfig.allow-skiplibcheck.json` — per‑package rationale for `skipLibCheck`.
- `examples/tsup/tsup.base.config.ts` — central `external` list for monorepos.

Quick trial:

```bash
DEP_FENCE_CONFIG=examples/policies/minimal/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_REPO_CONFIG=examples/repo-config/dep-fence.config.json pnpm dep-fence
```

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

### Advanced: TypeScript Config Loader and Custom Rules 🧩

- dep‑fence can load `dep-fence.config.ts` without ts-node/tsx. If Node can’t import `.ts`, it falls back to a built‑in lightweight transpiler (type‑only strips) and evaluates the module.
- You can also register custom runtime rules per policy:

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

## License 📄

MIT

---

Happy fencing! 🧱✨ Add reasons to rules and keep dependencies sane.

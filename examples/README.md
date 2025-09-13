# dep-fence Examples (official)

This directory hosts stack/recipe oriented examples for typical monorepos.

## Layout
- `examples/common/` — stack‑agnostic policies/templates
- `examples/stacks/` — stack/versions (React, Router v7, TS v5, bundlers, MapLibre)
- `examples/recipes/` — ready‑to‑run combinations
- `examples/_shared/` — shared fixtures

## Bundlers: Vite/Webpack recipes
- Vite
  - `examples/stacks/bundlers/vite/recipes/package-exports-guard/dep-fence.config.ts`
  - `examples/stacks/bundlers/vite/recipes/multi-entry-workers/dep-fence.config.ts`
- Webpack
  - `examples/stacks/bundlers/webpack/recipes/package-exports-guard/dep-fence.config.ts`
  - `examples/stacks/bundlers/webpack/recipes/multi-entry-workers/dep-fence.config.ts`
  - Generic alias: `examples/recipes/package-exports-guard/dep-fence.config.ts`

## New policies & recipes
- React base
  - `examples/stacks/react/base/policies/ui-peers-light/dep-fence.config.ts`
  - `examples/stacks/react/base/policies/ui-peer-policy/dep-fence.config.ts`
  - `examples/stacks/react/base/policies/minimal/dep-fence.config.ts`
  - Recipes: `examples/recipes/ui-peers-light/dep-fence.config.ts`, `examples/recipes/minimal/dep-fence.config.ts`
- React Router v7
  - `examples/stacks/react/router-v7/policies/minimal/dep-fence.config.ts`
  - `examples/stacks/react/router-v7/policies/apps-only/dep-fence.config.ts`
  - Recipes: `examples/recipes/router-v7-minimal/dep-fence.config.ts`, `examples/recipes/router-v7-apps-only/dep-fence.config.ts`
- TypeScript v5
  - `examples/stacks/typescript/v5/tsconfig-paths/dep-fence.config.ts`
  - `examples/stacks/typescript/v5/non-ui-paths-hygiene/dep-fence.config.ts`
  - `examples/stacks/typescript/v5/package-types-dist/dep-fence.config.ts`
  - `examples/stacks/typescript/v5/publishable-local-shims/dep-fence.config.ts`
  - `examples/stacks/typescript/v5/skiplibcheck-governance/dep-fence.config.ts`
  - `examples/stacks/typescript/v5/source-import-ban/dep-fence.config.ts`
  - `examples/stacks/typescript/v5/custom-rule/dep-fence.config.ts`
  - Recipes: see `examples/recipes/*` counterparts
- MapLibre
  - `examples/stacks/maplibre/maplibre-encapsulation/dep-fence.config.ts`
  - `examples/stacks/maplibre/maplibre-allowlist/dep-fence.config.ts`

## Quick start

```bash
# Minimal policy set
DEP_FENCE_CONFIG=examples/recipes/minimal/dep-fence.config.ts pnpm dep-fence

# Focused examples
DEP_FENCE_CONFIG=examples/recipes/tsconfig-paths/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_CONFIG=examples/recipes/package-exports-guard/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_CONFIG=examples/stacks/bundlers/vite/recipes/multi-entry-workers/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_CONFIG=examples/recipes/maplibre-allowlist/dep-fence.config.ts pnpm dep-fence

# Repo‑wide JSON settings
DEP_FENCE_REPO_CONFIG=examples/repo-config/dep-fence.config.json pnpm dep-fence

# Guards (pre‑commit / pre‑push)
pnpm dlx tsx examples/guards/run.ts --mode pre-commit
pnpm dlx tsx examples/guards/run.ts --mode pre-push

# Specific guard configs
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.ui-peers.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.ui-peer-policy.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.pkg-exports.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.tsconfig-hygiene.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.publishable-tsconfig-hygiene.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.jsx-option-for-tsx.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.router-v7-minimal.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.router-v7-apps-only.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.tsconfig-paths.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.maplibre-allowlist.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.package-types-dist.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.strict-ui.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.source-import-ban.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit --config examples/guards/guards.custom-repo-field.config.ts
```

Note: dep‑fence scans packages in your workspace (e.g. `packages/*/**/package.json`). Copy and adapt these examples to your repo.

TS hygiene starter:
```
# Keep tsconfig healthy for publishable packages
DEP_FENCE_CONFIG=examples/recipes/publishable-tsconfig-hygiene/dep-fence.config.ts pnpm dep-fence

# Enforce paths to dist/*.d.ts (avoid ../src references)
DEP_FENCE_CONFIG=examples/recipes/tsconfig-paths/dep-fence.config.ts pnpm dep-fence
```

UI policies — quick guide:
- `ui-peer-policy` (recipe): package.json‑only check; fast to adopt; good first step.
- `ui-peers-light` (recipe): gentle variant; WARN by default; no bundler checks.
- `minimal` (stack): adds bundler externals alignment (tsup) on top of peers.
- `strict-ui` (recipe): strict peers + bundler alignment; suitable for CI gating in libraries.

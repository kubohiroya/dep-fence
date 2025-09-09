# dep-fence Examples

This folder contains sample configurations you can copy into your repo.

- policies/minimal/dep-fence.config.ts — a small, readable policy set (OK/NG inline guidance)
- policies/strict-ui/dep-fence.config.ts — stricter UI rules + severity overrides (OK/NG)
- policies/source-import-ban/dep-fence.config.ts — ban specific named imports (OK/NG)
- policies/tsconfig-paths/dep-fence.config.ts — enforce paths to dist/*.d.ts; forbid ../src (OK/NG)
- policies/package-exports-guard/dep-fence.config.ts — guard worker subpaths from exposing types (OK/NG)
- policies/package-types-dist/dep-fence.config.ts — require types for entries to point to dist/*.d.ts (OK/NG)
- policies/multi-entry-workers/dep-fence.config.ts — combined example for multi‑entry + workers (OK/NG)
- policies/custom-rule/dep-fence.config.ts — minimal custom runtime rule (OK/NG)
- policies/publishable-tsconfig-hygiene/dep-fence.config.ts — require base tsconfig + forbid ../src (OK/NG)
- policies/publishable-local-shims/dep-fence.config.ts — discourage long‑lived local *.d.ts shims (OK/NG)
- policies/jsx-option-for-tsx/dep-fence.config.ts — enforce jsx: react-jsx for TSX (OK/NG)
- policies/skiplibcheck-governance/dep-fence.config.ts — govern skipLibCheck usage (OK/NG)
- policies/non-ui-paths-hygiene/dep-fence.config.ts — discourage ../src across the board (OK/NG)
- policies/maplibre-encapsulation/dep-fence.config.ts — isolate MapLibre deps to a wrapper pkg (OK/NG)
- guards/guards.config.ts — example guard rules (allowed-dirs, mtime-compare, upstream-conflict)
- repo-config/dep-fence.config.json — repo‑wide operational settings
- tsconfig/tsconfig.allow-skiplibcheck.json — per‑package skipLibCheck with rationale
- tsup/tsup.base.config.ts — example of declaring externals shared across packages

Quick trial using environment variables:

```bash
# Use a specific policy module (overrides discovery)
DEP_FENCE_CONFIG=examples/policies/minimal/dep-fence.config.ts pnpm dep-fence

# Use repo‑wide JSON settings explicitly
DEP_FENCE_REPO_CONFIG=examples/repo-config/dep-fence.config.json pnpm dep-fence

# Try focused examples:
# Public API only (ban specific imports)
DEP_FENCE_CONFIG=examples/policies/source-import-ban/dep-fence.config.ts pnpm dep-fence

# Path hygiene (dist declarations only)
DEP_FENCE_CONFIG=examples/policies/tsconfig-paths/dep-fence.config.ts pnpm dep-fence

# Worker subpaths JS-only
DEP_FENCE_CONFIG=examples/policies/package-exports-guard/dep-fence.config.ts pnpm dep-fence

# Multi-entry + workers combined
DEP_FENCE_CONFIG=examples/policies/multi-entry-workers/dep-fence.config.ts pnpm dep-fence

# skipLibCheck governance
DEP_FENCE_CONFIG=examples/policies/skiplibcheck-governance/dep-fence.config.ts pnpm dep-fence

# jsx option for TSX
DEP_FENCE_CONFIG=examples/policies/jsx-option-for-tsx/dep-fence.config.ts pnpm dep-fence

# Guards (pre-commit / pre-push style)
# Run with tsx directly (or copy these into your repo hooks)
pnpm dlx tsx examples/guards/run.ts --mode pre-commit
pnpm dlx tsx examples/guards/run.ts --mode pre-push
```

Note: dep‑fence scans packages in your workspace (e.g. `packages/*/**/package.json`).
These examples are meant to be copied into your own repo and adapted to your needs.

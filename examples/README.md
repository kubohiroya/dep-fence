# dep-fence Examples

This folder contains sample configurations you can copy into your repo.

- policies/minimal/dep-fence.config.ts — a small, readable policy set
- policies/strict-ui/dep-fence.config.ts — stricter UI rules + severity overrides
- repo-config/dep-fence.config.json — repo‑wide operational settings
- tsconfig/tsconfig.allow-skiplibcheck.json — per‑package skipLibCheck with rationale
- tsup/tsup.base.config.ts — example of declaring externals shared across packages

Quick trial using environment variables:

```bash
# Use a specific policy module (overrides discovery)
DEP_FENCE_CONFIG=examples/policies/minimal/dep-fence.config.ts pnpm dep-fence

# Use repo‑wide JSON settings explicitly
DEP_FENCE_REPO_CONFIG=examples/repo-config/dep-fence.config.json pnpm dep-fence
```

Note: dep‑fence scans packages in your workspace (e.g. `packages/*/**/package.json`).
These examples are meant to be copied into your own repo and adapted to your needs.


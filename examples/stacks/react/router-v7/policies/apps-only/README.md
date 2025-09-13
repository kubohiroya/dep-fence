# React Router v7 — Apps Only

Goal: restrict router initialization/providers (`create*Router`, `RouterProvider`) to `src/app` or `src/routes` within UI packages, avoiding leakage into shared UI libs.

Custom check
- `router-constructors-outside-allowed` (default WARN)
  - flags files that import `create*Router`/`RouterProvider` outside allowed folders

Run:
```
DEP_FENCE_CONFIG=examples/stacks/react/router-v7/policies/apps-only/dep-fence.config.ts pnpm dep-fence
```

Customize:
- adjust `allowed` directories as needed
- raise severity with `severityOverride` if desired


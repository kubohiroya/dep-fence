# Recipe: Router v7 apps-only boundaries

Restrict `create*Router` / `RouterProvider` usage to `src/app` / `src/routes` (default WARN).

Run:
```
DEP_FENCE_CONFIG=examples/recipes/router-v7-apps-only/dep-fence.config.ts pnpm dep-fence
```

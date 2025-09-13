# Webpack recipe: multi-entry-workers

Multi-entry setup where `workers/*` subpaths publish JS only, with types provided by the root entry.

Run:
```
DEP_FENCE_CONFIG=examples/stacks/bundlers/webpack/recipes/multi-entry-workers/dep-fence.config.ts pnpm dep-fence
```

Notes (Webpack):
- Keep worker exposure consistent with library `exports`; types from the root API.

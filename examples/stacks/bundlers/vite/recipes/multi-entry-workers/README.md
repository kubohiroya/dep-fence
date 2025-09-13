# Vite recipe: multi-entry-workers

Multi-entry setup where `workers/*` subpaths publish JS only, with types provided by the root entry.

Run:
```
DEP_FENCE_CONFIG=examples/stacks/bundlers/vite/recipes/multi-entry-workers/dep-fence.config.ts pnpm dep-fence
```

Notes (Vite):
- Mind `?worker` handling and ensure types come from the root API.

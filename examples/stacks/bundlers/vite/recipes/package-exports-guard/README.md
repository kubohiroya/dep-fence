# Vite recipe: package-exports-guard

Guard `exports` subpaths to forbid fields like `types` (e.g., for `./workers/*`).

Run:
```
DEP_FENCE_CONFIG=examples/stacks/bundlers/vite/recipes/package-exports-guard/dep-fence.config.ts pnpm dep-fence
```

Notes (Vite/Rollup):
- Externalize libraries listed in `peerDependencies` via `build.rollupOptions.external` to avoid duplicate bundles.

# Webpack recipe: package-exports-guard

Guard `exports` subpaths to forbid fields like `types` (e.g., for `./workers/*`).

Run:
```
DEP_FENCE_CONFIG=examples/stacks/bundlers/webpack/recipes/package-exports-guard/dep-fence.config.ts pnpm dep-fence
```

Notes (Webpack):
- Keep `externals` in sync with `peerDependencies` to avoid bundling shared singletons.

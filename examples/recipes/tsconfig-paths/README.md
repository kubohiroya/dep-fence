# Recipe: tsconfig paths → dist/*.d.ts

Pin public types to `dist/*.d.ts` and avoid `../src` references in `paths`.

Run:
```
DEP_FENCE_CONFIG=examples/recipes/tsconfig-paths/dep-fence.config.ts pnpm dep-fence
```

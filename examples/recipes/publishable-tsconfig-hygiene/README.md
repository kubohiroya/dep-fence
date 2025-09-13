# Recipe: publishable tsconfig hygiene

Publishable packages should extend the repo base tsconfig and avoid `../src` path mappings.

Run:
```
DEP_FENCE_CONFIG=examples/recipes/publishable-tsconfig-hygiene/dep-fence.config.ts pnpm dep-fence
```


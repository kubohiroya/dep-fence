# examples/common

Stack-agnostic examples useful for typical monorepos. These do not depend on a specific framework or version.

## Includes
- policies (dependency boundaries, tsconfig hygiene, exports, etc.)
- guards (pre-commit / pre-push runnable presets)
- repo-config / tsconfig / tsup (template configs)

For now the concrete files still live under legacy paths (moving gradually):
- policies: `../policies/*` that are stack-agnostic
- guards: `../guards/*`
- repo-config: `../repo-config/*`
- tsconfig: `../tsconfig/*`
- tsup: `../tsup/*`

## Quick run
```
DEP_FENCE_CONFIG=examples/recipes/minimal/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_CONFIG=examples/recipes/tsconfig-paths/dep-fence.config.ts pnpm dep-fence
```


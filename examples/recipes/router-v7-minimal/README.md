# Recipe: Router v7 minimal boundaries

Minimal setup that forbids direct `react-router-dom` usage in non‑UI packages.

Run:
```
DEP_FENCE_CONFIG=examples/recipes/router-v7-minimal/dep-fence.config.ts pnpm dep-fence
```

Note: In UI packages, combine with `strict-ui`/`ui-peers-light` to check peers/externals alignment.

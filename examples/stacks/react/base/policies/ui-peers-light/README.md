# UI peers (light)

Lightweight policy encouraging React/MUI/Emotion to live in `peerDependencies` (not `dependencies`). Default severity: WARN.

Run:
```
DEP_FENCE_CONFIG=examples/stacks/react/base/policies/ui-peers-light/dep-fence.config.ts pnpm dep-fence
```

For stricter checks (including bundler externals), use `strict-ui`.


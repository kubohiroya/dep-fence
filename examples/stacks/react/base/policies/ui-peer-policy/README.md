# UI Peer Policy (package.json only)

Static, package.json‑only check that keeps React/MUI/Emotion in `peerDependencies` (not `dependencies`).

Run:
```
DEP_FENCE_CONFIG=examples/stacks/react/base/policies/ui-peer-policy/dep-fence.config.ts pnpm dep-fence
```

For bundler externals alignment, combine with `strict-ui`.


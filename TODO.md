# TODO — check-deps (Conditions + Reasons)

Purpose: Track mechanism-level improvements (not repo policy changes). Items are grouped by priority. Boxes indicate intended state; check when done.

## Core (P1)
- [ ] Policy overrides at repo root via `dep-fence.config.ts`
  - [ ] Merge user `policies` over built-ins (prepend/append strategies)
  - [ ] Type-safe import (`Policy`, helpers) with IDE hints
  - [ ] Per-policy `severityOverride` honored
- [ ] Typed allowlists (per-rule exceptions)
  - [ ] Config schema: `{ ruleId, package: string, because: string }[]`
  - [ ] Apply at evaluation time; echo reason back into findings
- [ ] Selective execution flags
  - [ ] `--only <rule1,rule2>` to run a subset
  - [ ] `--skip <rule>` to suppress noisy rules
  - [ ] `--attr <ui,publishable,...>` to restrict by inferred attributes
- [ ] Change-scope limiting
  - [ ] `--since <git-ref>`: run only on changed packages (git diff + workspace mapping)

## Dependency-cruiser integration (P1)
- [ ] Sharpen cross-src rule to avoid false positives
  - [ ] Use package boundary capture: from `^packages/([^/]+)/src` to `^packages/(?!\\1)[^/]+/src`
  - [ ] Resolve tsconfig paths/aliases before applying rule
- [ ] Split rulesets for easy toggling
  - [ ] `dc.cycles.cjs` (WARN) and `dc.cross-src.cjs` (WARN initially)
- [ ] Optional adapter
  - [ ] CLI flag `--dc <path-to-config>` to run and collect dc results into unified report

## CI & Reporting (P1)
- [ ] GitHub Job Summary
  - [ ] Emit markdown summary to `$GITHUB_STEP_SUMMARY` (top N rules/packages)
- [ ] Machine-readable outputs
  - [x] `--json` — keep stable schema and document
  - [ ] `--sarif` — enable Code Scanning integration (ruleId/severity/locations)
- [ ] Pin tool versions in devDependencies (avoid ad-hoc npx)
  - [ ] Add `dependency-cruiser`, `syncpack`, `publint`, `@arethetypeswrong/cli` to root devDeps
  - [ ] Update CI to run local binaries

## Adapters / Light auto-fixes (P2)
- [ ] Unified report aggregator
  - [ ] Ingest dc/syncpack/publint/attw outputs, group by package, carry a common “Because”
- [ ] Dry-run auto-fixers
  - [ ] `--fix=ui-peers`: move React/MUI/Emotion to peerDependencies and align `tsup.external`
  - [ ] `--fix=skiplibcheck-reason`: add `tsconfig.checkDeps.reason` or move to allowlist
  - [ ] `--fix=paths-suggest`: propose replacements for `../src` references

## Quality & Performance (P2)
- [ ] Unit tests (fixtures under `__tests__`)
  - [ ] Attribute inference (ui, publishable/private, usesTsup, hasTsx, browser/node, worker, next, storybook, app)
  - [ ] Rule runners (peer-in-external, external-in-deps, ui-in-deps, jsx-mismatch, tsconfig-no-base, paths-direct-src, local-shims, skipLibCheck-*)
  - [ ] Policy engine: because propagation, severity overrides, allowlists
- [ ] Performance
  - [ ] Parallelize package scans; cap filesystem walks
  - [ ] Cache by package mtime + hash to skip unchanged work
- [ ] Docs
  - [ ] Add “Integration recipes” (local/CI), phased STRICT model
  - [ ] Side-by-side responsibilities vs dependency-cruiser/ESLint/syncpack/publint/attw

## Nice-to-haves (P3)
- [ ] Output formatter options: `--format compact|full|ndjson`
- [ ] Rich console output with rule grouping and colorized reasons
- [ ] Config validation errors with helpful examples

---
Owner: Tools / Platform
Review cadence: Weekly until STRICT rollout, then monthly

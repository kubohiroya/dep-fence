# TASKS (English)

## Branching Strategy
- Naming: `<type>/<scope>/<slug>` (e.g., `chore/examples/skeleton-layout`)
- Merge: Squash & Merge; introduce changes incrementally (small diffs)

## Kanban

### Doing
- Reorganize `examples` into common vs stack-specific (Phase 1)
  - Branch: `chore/examples/skeleton-layout`
  - Depends: none (no file moves yet)
  - DoD:
    - Create `examples/common`, `examples/stacks`, `examples/recipes`, `examples/_shared`
    - Add READMEs describing purpose/usage/migration candidates
    - Update `examples/README.md` with structure and migration policy
    - No destructive changes to existing examples
  - Checklist:
    - [x] Directories created
    - [x] README (common)
    - [x] README (stacks + subtrees)
    - [x] README (recipes/_shared)
    - [x] Update examples/README.md

### ToDo (priority order)
- Phase 2: Move individual policies (1–2 dirs per PR)
  - Depends: Phase 1 complete
  - DoD: leave stubs at old paths; move to new paths; update links
  - Progress:
    - [x] Move jsx-option-for-tsx to stacks/react/base (re-export at old path)
    - [x] Move maplibre-encapsulation to stacks/maplibre (re-export)
    - [x] Move strict-ui to stacks/react/base (re-export)
    - [x] Move publishable-tsconfig-hygiene to stacks/typescript/v5 (re-export)
    - [x] Add bundlers (vite/webpack) recipes (package-exports-guard / multi-entry-workers)
    - [x] Add UI peers light to stacks/react/base
    - [x] Move tsconfig-paths to stacks/typescript/v5 (re-export)
    - [x] Add recipes (ui-peers-light / tsconfig-paths)
    - [x] Add router-v7 minimal (ban router API in non-UI)
    - [x] Add recipe for router-v7-minimal
    - [x] Add router-v7 apps-only (limit to app/routes in UI)
    - [x] Add recipe for router-v7-apps-only
    - [x] Reflect minimal in stacks/react/base (recipes)
    - [x] Reflect non-ui-paths-hygiene / package-types-dist / publishable-local-shims / skiplibcheck-governance / source-import-ban / custom-rule in stacks/typescript/v5 (recipes)
    - [x] Add generic recipe alias for package-exports-guard
    - [x] Add Router v7 guard presets (minimal / apps-only)
    - [x] Introduce rule plugin API (create=>check) in TS
    - [x] Implement/register ui-peer-policy / maplibre-allowlist plugins
    - [x] Add plugin-based policies to examples (ui-peer-policy / maplibre-allowlist)
    - [x] Add upstream guide (EN)
- Phase 3: Update root README links to new paths
- Phase 4: Consolidate guards under `common/` (keep compatible aliases)

### Done
- n/a

## Flags
- None; this reorg affects docs/examples only.

## Rollback
- Remove the new directories/READMEs to revert; existing examples remain intact.

## Work Log
- 2025-09-13 start: Begin Phase 1 skeleton.
- 2025-09-13 done: Phase 1 directories + READMEs.
- 2025-09-13 done: Phase 2 (jsx-option-for-tsx, maplibre-encapsulation, strict-ui, publishable-tsconfig-hygiene; bundlers recipes).
- 2025-09-13 done: Phase 2 (ui-peers-light; tsconfig-paths; recipes; router-v7 minimal/apps-only + recipes).
- 2025-09-13 done: Reflect remaining policies in stacks/recipes; add custom-rule.
- 2025-09-13 done: Add Router v7 guard presets.
- 2025-09-13 done: Add rule plugin API + two plugins; update examples/README and docs.


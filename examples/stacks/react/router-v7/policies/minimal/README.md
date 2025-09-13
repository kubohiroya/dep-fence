# React Router v7 — Minimal Boundaries

Goal: keep routing concerns (`react-router-dom` APIs) in UI apps/route modules and prevent leakage into non‑UI packages (domain/core).

Scope:
- when: packages that are `publishable` and `not(ui)`

Checks (examples):
- Forbid the following imports in non‑UI packages:
  - `Link`, `NavLink`, `Outlet`
  - `useNavigate`, `useLocation`, `useParams`, `useSearchParams`
  - `createBrowserRouter`, `createMemoryRouter`, `RouterProvider`

Run:
```
DEP_FENCE_CONFIG=examples/stacks/react/router-v7/policies/minimal/dep-fence.config.ts pnpm dep-fence
```

Pair with: `ui-peers-light`/`strict-ui`, `publishable-tsconfig-hygiene`, `tsconfig-paths`.


# React Router v7

Import boundary rules for route splitting, lazy loading, and the data APIs. See the minimal/apps‑only policies for concrete checks.

Ideas:
- Forbid reverse dependencies from UI/view layers into domain/core.
- Discourage direct imports from `@/routes/*` outside route modules.

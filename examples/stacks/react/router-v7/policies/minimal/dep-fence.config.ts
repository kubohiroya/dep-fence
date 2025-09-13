import type { Policy } from 'dep-fence/types';
import { all, not, isPublishable, isUI } from 'dep-fence/conditions';

// Minimal boundaries for React Router v7 style apps
// Goal: keep routing APIs in UI apps/route modules; forbid direct usage in non-UI packages.
export const policies: Policy[] = [
  {
    id: 'react-router-v7-boundaries',
    when: all(isPublishable(), not(isUI())),
    because: 'Routing concerns belong to UI apps and route modules; domain/core packages should not depend on react-router-dom runtime.',
    rules: ['source-import-ban'],
    options: {
      'source-import-ban': {
        from: ['react-router-dom'],
        names: [
          'Link', 'NavLink', 'Outlet',
          'useNavigate', 'useLocation', 'useParams', 'useSearchParams',
          'createBrowserRouter', 'createMemoryRouter', 'RouterProvider',
        ],
      },
    },
  },
];

// Notes
// - UI packages (apps, feature UI) may still use router APIs; the restriction applies to non-UI packages.
// - Combine with ui-peers-light/strict-ui to keep React/MUI/Emotion as peers.


import type { Finding, Severity } from '../types';
import type { RuleRunner, RuleContext } from '../rules';

export interface UiPeerPolicyOptions {
  libs?: string[];
  forbidInDeps?: boolean; // default true
  requireInPeers?: boolean; // default true
  severity?: Partial<Record<'ui-in-deps' | 'ui-missing-peer', Severity>>;
}

const DEFAULT_LIBS = [
  'react',
  'react-dom',
  '@mui/material',
  '@mui/icons-material',
  '@emotion/react',
  '@emotion/styled',
];

export function create(options: UiPeerPolicyOptions = {}): RuleRunner {
  const libs = new Set(options.libs && options.libs.length ? options.libs : DEFAULT_LIBS);
  const forbidInDeps = options.forbidInDeps !== false;
  const requireInPeers = options.requireInPeers !== false;
  const sevInDeps: Severity = options.severity?.['ui-in-deps'] || 'WARN';
  const sevMissingPeer: Severity = options.severity?.['ui-missing-peer'] || 'WARN';

  return function check(ctx: RuleContext): Finding[] {
    const f: Finding[] = [];
    const deps = new Set(Object.keys(ctx.pkgJson.dependencies || {}));
    const peers = new Set(Object.keys(ctx.pkgJson.peerDependencies || {}));
    const devs = new Set(Object.keys(ctx.pkgJson.devDependencies || {}));

    if (forbidInDeps) {
      const uiInDeps = [...libs].filter((u) => deps.has(u));
      if (uiInDeps.length) f.push({ packageName: ctx.pkgName, packageDir: ctx.pkgDir, rule: 'ui-in-deps', severity: sevInDeps, message: `UI libs should be peerDependencies (not dependencies):\n- ${uiInDeps.join('\n- ')}`, because: ctx.because });
    }

    if (requireInPeers) {
      const uiMissingPeer = [...libs].filter((u) => (deps.has(u) || devs.has(u)) && !peers.has(u));
      if (uiMissingPeer.length) f.push({ packageName: ctx.pkgName, packageDir: ctx.pkgDir, rule: 'ui-missing-peer', severity: sevMissingPeer, message: `UI libs installed but missing in peerDependencies:\n- ${uiMissingPeer.join('\n- ')}`, because: ctx.because });
    }

    return f;
  };
}


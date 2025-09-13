# dep-fence Upstream Guide (Rule Plugins)

This document proposes a minimal, upstream-friendly Rule Plugin API and demonstrates two static package.json checks migrated from prototype scripts.

- Minimal API: `create(options) => check(ctx)`
- Static checks: no filesystem crawling beyond `package.json`
- Goals: predictable review diffs, safe to run in CI, easy to compose into policies

## Rule Plugin API

A rule plugin exports a `create(options)` function that returns a `check(ctx)` runner.

- `options`: JSON-serializable configuration (documented per rule)
- `ctx`: `{ pkgName, pkgDir, pkgJson, defaultsExternals, allowSkipLibCheck, because }`
- Return: `Finding[]` with fields `{ packageName, packageDir, rule, severity, message, because }`

TypeScript signature:

```ts
export type Severity = 'INFO' | 'WARN' | 'ERROR';
export interface RuleContext { pkgName: string; pkgDir: string; pkgJson: any; defaultsExternals: string[]; allowSkipLibCheck: Set<string>; because?: string }
export interface Finding { packageName: string; packageDir: string; rule: string; severity: Severity; message: string; because?: string }
export type RuleRunner = (ctx: RuleContext) => Finding[];
export function create(options?: Options): RuleRunner;
```

dep-fence wires a plugin by mapping a rule id to the runner in its `ruleRegistry`. Policy authors can pass per-rule `options` in the policy file.

## Implemented Plugins (TS)

### UI Peer Policy — package.json only

File: `src/rules-plugins/uiPeerPolicy.ts`

- Purpose: keep React/MUI/Emotion in `peerDependencies` (not `dependencies`)
- Options:
  - `libs?: string[]` default: `['react','react-dom','@mui/material','@mui/icons-material','@emotion/react','@emotion/styled']`
  - `forbidInDeps?: boolean` default `true`
  - `requireInPeers?: boolean` default `true`
  - `severity?: { 'ui-in-deps'?: Severity, 'ui-missing-peer'?: Severity }`
- Findings:
  - `ui-in-deps` — listed under `dependencies`
  - `ui-missing-peer` — installed (deps/devDeps) but missing from `peerDependencies`

Example policy:

```ts
export const policies = [{
  id: 'ui-peer-policy',
  when: all(isUI(), isPublishable()),
  because: 'UI libs should be peers to avoid bundling shared singletons.',
  rules: ['ui-peer-policy'],
  options: { 'ui-peer-policy': { libs: ['react','react-dom'], forbidInDeps: true, requireInPeers: true } }
}];
```

### MapLibre Allowlist — package.json only

File: `src/rules-plugins/maplibreAllowlist.ts`

- Purpose: only allow specified wrapper packages to list MapLibre stack deps
- Options:
  - `libs?: string[]` default: `['maplibre-gl','@vis.gl/react-maplibre']`
  - `allow?: string[]` default: `['@hierarchidb/ui-map']`
  - `severity?: Severity` default `ERROR`
- Findings:
  - `maplibre-direct-dep` — dependency/peer/devDependency to a MapLibre lib found outside allowlist

Example policy:

```ts
export const policies = [{
  id: 'maplibre-allowlist',
  when: isPublishable(),
  because: 'Encapsulate MapLibre dependencies in the wrapper package.',
  rules: ['maplibre-allowlist'],
  options: { 'maplibre-allowlist': { allow: ['@your/ui-map'] } }
}];
```

## Testing Strategy

- Fixture packages under `examples/_shared/fixtures` or a dedicated `tests/fixtures` folder
- For each rule:
  - OK case: no findings
  - NG cases: findings include expected `rule` ids and messages
- Prefer table-driven tests with small `package.json` variants

## Usage Examples

See the example policies:
- `examples/stacks/react/base/policies/ui-peer-policy/dep-fence.config.ts`
- `examples/stacks/maplibre/maplibre-allowlist/dep-fence.config.ts`

## Migration Notes

- Existing built-in checks (`ui-in-deps`, `ui-missing-peer`, `maplibre-direct-dep`) remain available.
- New plugin ids: `ui-peer-policy`, `maplibre-allowlist` provide a single-rule surface with rule-local `options`.
- Policies can gradually adopt the plugin rules without breaking current configs.


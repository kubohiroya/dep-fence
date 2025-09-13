# dep-fence アップストリームガイド（ルール・プラグイン）

本書は、最小のプラグイン API と、その API で実装した 2 つの package.json 静的チェックの例を示します。

- 最小 API: `create(options) => check(ctx)`
- 静的チェック: `package.json` の読み取りのみ（ファイルシステムを深追いしない）
- 目的: レビュー差分が安定、CI で安全、ポリシーへ容易に合成

## ルール・プラグイン API

ルール・プラグインは `create(options)` をエクスポートし、`check(ctx)` ランナーを返します。

- `options`: JSON 化可能な設定（各ルールで記載）
- `ctx`: `{ pkgName, pkgDir, pkgJson, defaultsExternals, allowSkipLibCheck, because }`
- 返り値: `Finding[]`（`{ packageName, packageDir, rule, severity, message, because }`）

TypeScript 署名:

```ts
export type Severity = 'INFO' | 'WARN' | 'ERROR';
export interface RuleContext { pkgName: string; pkgDir: string; pkgJson: any; defaultsExternals: string[]; allowSkipLibCheck: Set<string>; because?: string }
export interface Finding { packageName: string; packageDir: string; rule: string; severity: Severity; message: string; because?: string }
export type RuleRunner = (ctx: RuleContext) => Finding[];
export function create(options?: Options): RuleRunner;
```

dep‑fence は `ruleRegistry` でルール ID とランナーを紐付けます。ポリシー側は `options` でルールごとの設定を渡せます。

## 実装済みプラグイン（TS）

### UI Peer Policy — package.json のみ

ファイル: `src/rules-plugins/uiPeerPolicy.ts`

- 目的: React/MUI/Emotion を `dependencies` ではなく `peerDependencies` に置く
- Options:
  - `libs?: string[]` 既定: `['react','react-dom','@mui/material','@mui/icons-material','@emotion/react','@emotion/styled']`
  - `forbidInDeps?: boolean` 既定 `true`
  - `requireInPeers?: boolean` 既定 `true`
  - `severity?: { 'ui-in-deps'?: Severity, 'ui-missing-peer'?: Severity }`
- Findings:
  - `ui-in-deps` — `dependencies` に UI ライブラリがある
  - `ui-missing-peer` — インストール済みだが `peerDependencies` に無い

ポリシー例:

```ts
export const policies = [{
  id: 'ui-peer-policy',
  when: all(isUI(), isPublishable()),
  because: 'UI libs should be peers to avoid bundling shared singletons.',
  rules: ['ui-peer-policy'],
  options: { 'ui-peer-policy': { libs: ['react','react-dom'], forbidInDeps: true, requireInPeers: true } }
}];
```

### MapLibre Allowlist — package.json のみ

ファイル: `src/rules-plugins/maplibreAllowlist.ts`

- 目的: 指定したラッパーパッケージ以外では MapLibre 系の依存を禁止
- Options:
  - `libs?: string[]` 既定: `['maplibre-gl','@vis.gl/react-maplibre']`
  - `allow?: string[]` 既定: `['@hierarchidb/ui-map']`
  - `severity?: Severity` 既定 `ERROR`
- Findings:
  - `maplibre-direct-dep` — 許可リスト外のパッケージが MapLibre に依存

ポリシー例:

```ts
export const policies = [{
  id: 'maplibre-allowlist',
  when: isPublishable(),
  because: 'Encapsulate MapLibre dependencies in the wrapper package.',
  rules: ['maplibre-allowlist'],
  options: { 'maplibre-allowlist': { allow: ['@your/ui-map'] } }
}];
```

## テスト戦略

- `examples/_shared/fixtures` または `tests/fixtures` にフィクスチャを配置
- 各ルールについて:
  - OK ケース: Finding なし
  - NG ケース: 期待する `rule` とメッセージを含む
- 小さな `package.json` バリエーションでテーブル駆動のテストを推奨

## 利用例

以下のサンプル・ポリシーを参照:
- `examples/stacks/react/base/policies/ui-peer-policy/dep-fence.config.ts`
- `examples/stacks/maplibre/maplibre-allowlist/dep-fence.config.ts`

## 移行ノート

- 既存の組み込みチェック（`ui-in-deps`, `ui-missing-peer`, `maplibre-direct-dep`）は引き続き利用可能
- 新しいプラグイン ID（`ui-peer-policy`, `maplibre-allowlist`）は、ルール単位で `options` を受け付ける薄い入口
- 既存ポリシーへ段階的に採用可能（互換性を保ちながら移行）


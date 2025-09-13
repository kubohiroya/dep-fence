# dep-fence 🧱✨
[![npm version](https://img.shields.io/npm/v/dep-fence?style=flat-square)](https://www.npmjs.com/package/dep-fence)
[![license](https://img.shields.io/npm/l/dep-fence?style=flat-square)]

モノレポにおけるパッケージの依存関係と TypeScript 設定の健全性を守るツールです。豊富なポリシー例と明示的な理由に基づいています。  
すべての検出結果には、そのルールが **必須** か **推奨** かの理由が説明され、レビューを焦点化し予測可能にします。  
レビューの自動化、次に取るべき行動の明確化、そして検出結果をコーディング支援 AI への指示に直接つなげるのに役立ちます。🚥

## 目次 🧭

- [What, Why & How 💡](#what-why--how-)
- [Install 📦](#install-)
- [Getting Started 🛣️](#getting-started-)
- [Basic Usage 🖥️](#basic-usage-)
- [Advanced Usage 💪](#advanced-usage-)
    - [Policy Configuration 🛠️](#policy-configuration-)
    - [Git Integration: pre‑commit / pre‑push 🐙](#git-integration-precommit--prepush-)
    - [CI Integration 🛡️](#ci-integration-)
- [Examples 📁](#examples-)
    - [What It Checks 🔍](#what-it-checks-)
    - [Default Policies (catalog) 📚](#default-policies-catalog-)
- [Programmatic API 🧩](#programmatic-api-)
- [Troubleshooting 🆘](#troubleshooting-)
- [FAQ ❓](#faq-)
- [Author ✍️](#author-)
- [License 📄](#license-)

---
## What, Why & How 💡

- **What it is**: リポジトリ全体の依存関係境界を守る軽量なポリシー駆動ガードレール。境界越えを検知し、必要なら CI を失敗させます。典型的な用途: Public API のみの import 強制、UI/ドメイン層の分離、`peerDependencies` とバンドラ externals の整合、`tsconfig` の健全化、`skipLibCheck` の管理 ― いずれも明示的な「Because: …」つき。
- **Problems it solves**: deep import の漏れ、モノレポにおける偶発的なパッケージ間結合、公開時に壊れる型/エクスポートのズレ、peer と bundler external の不一致、JSX オプションの不整合など。
- **How it compares and when to use which**:
  - [ESLint](https://eslint.org): ファイル単位の静的解析とスタイル/バグ検出に最適。ファイル内の課題は ESLint（必要に応じて `import/no-internal-modules` や `no-restricted-imports` などのルールも）に任せ、パッケージ横断の境界やリポジトリ全体のポリシーは dep-fence を使用。
  - [Knip](https://knip.dev): **未使用/不足依存（unused/missing dependencies）** と **未使用ファイル/エクスポート** を検出し、**モノレポを第一級でサポート**。依存関係の棚卸しとデッドコードの可視化には Knip、パッケージ境界ポリシーと CI ゲーティングには dep-fence —— 互いを補完します。
  - [dependency-cruiser](https://www.npmjs.com/package/dependency-cruiser) / [madge](https://github.com/pahen/madge): 依存グラフの可視化と検証に有用。探索や複雑なグラフ規則にはこれら、単純な allow/forbid で回せる意見主導・CI ファーストのポリシーエンジンとしては dep-fence。
  - [syncpack](https://jamiemason.github.io/syncpack/): モノレポ全体でバージョンやワークスペース範囲の整合性を維持。マニフェスト衛生は syncpack、実行/ビルド時の import と peer/bundler の整合は dep-fence。
  - [publint](https://publint.dev): **公開パッケージの表面（exports/fields）** をリンティングし、環境互換性やよくある落とし穴を検出。publint は利用者を保護し、dep-fence は公開前にソースが境界を尊重しているかを守る役割。
  - （任意）[Are the Types Wrong? (attw)](https://github.com/arethetypeswrong/arethetypeswrong.github.io/tree/main/packages/cli): 公開成果物の **TypeScript 型解決/エクスポート** を検証。publint と組み合わせるとリリースパイプラインで相性良好。

### Why dep‑fence? ✨
- 条件駆動のルール（例: UI かつ publishable なパッケージにのみ適用）。
- tsup の `external` と `peerDependencies` を整合させ、二重バンドルを防止。📦➕📦❌
- `skipLibCheck` を理由付きまたは許可リストでガバナンス。⚖️
- `tsconfig` を健全に保つ（ベース継承、`../src` の直接参照禁止、JSX オプションの整合）。
- すべてのメッセージに「Because: …」を含め、ポリシー意図を見える化。🗣️

これは、既存のリンター、グラフ解析ツール、依存関係インベントリツール、そしてパッケージ公開の検証ツールと並走して機能します。これらを組み合わせることで、ファイル内の品質、依存関係の衛生管理、リリース準備性をカバーできます —— 一方で dep-fence は、パッケージ横断の境界を強制し、CI ファーストのポリシー・ガードレールを提供します。

### How it works? 🧭

- `pnpm-workspace.yaml` または最も近い `package.json` からレポジトリルートを検出。
- 次のパッケージディレクトリを走査:
    - `packages/*/**/package.json`
    - `app/package.json`（存在する場合）
- 属性を推定: `ui`, `publishable/private`, `usesTsup`, `hasTsx`, `browser/node`, `worker`, `next`, `storybook`, `app`。
- リポジトリの `tsup.base.config.*` と各パッケージの `tsup.config.*` から `tsup.external` を導出（利用可能な場合）。

---
## Install 📦

ローカル（推奨）:

```bash
pnpm add -D dep-fence
# or
npm i -D dep-fence
```

グローバル:

```bash
npm i -g dep-fence
```

要件: Node.js >= 18

---
## Getting Started 🛣️

### CLI Usage

```bash
dep-fence                    # YAML 出力（デフォルト）
dep-fence --format pretty    # 人間向け（pretty）
dep-fence --format yaml      # 明示的に YAML
dep-fence -f yaml -g severity  # ERROR/WARN/INFO でグループ化
dep-fence -f json            # JSON 出力
dep-fence --strict           # ERROR があれば exit 1
dep-fence -c path/to/dep-fence.config.ts  # 明示的なポリシーファイル（TS/JS対応）
dep-fence -h                 # help
dep-fence -v                 # version
```

### Output Formats

- デフォルト: パッケージごとに YAML（`--format yaml --group-by package` と同等）。
- Pretty: `--format pretty` で人間向け、パッケージ単位の出力。
- JSON: `--format json` で機械可読。
- YAML のグルーピング: `--group-by <package|rule|severity>` は YAML のみに影響。
    - 例:
        - `dep-fence --format yaml --group-by rule`
        - `dep-fence --format yaml --group-by severity`

短縮フラグ: `-f` = `--format`, `-g` = `--group-by`, `-c` = `--config`。

注: 旧来の `--json` は削除されました。代わりに `--format json` を使用。

### Commands and expected output

```bash
pnpm dep-fence
pnpm dep-fence --strict  # CI ゲート（ERROR で失敗）
```

成功出力
```
✔ No violations (0)
```

違反出力（YAML デフォルト）:

```yaml
"@your/ui-button":
  - type: ui-in-deps
    severity: ERROR
    message: |
      UI libs should be peerDependencies (not dependencies):
      - react
    reason: UI packages should not bundle React/MUI; rely on host peers.
```

違反出力（`--format pretty` の場合）:

```
=== @your/ui-button ===
ERROR ui-in-deps: UI libs should be peerDependencies (not dependencies):
- react
Because: UI packages should not bundle React/MUI; rely on host peers.
```

### Zero‑Config Mode 🚀

ゼロコンフィグモードは、典型的なモノレポでデフォルトのパッケージポリシー（パッケージレベルのチェック）を実行します。

- 最寄りの `pnpm-workspace.yaml` または `package.json` からレポジトリルートを自動検出。
- `packages/*/**/package.json` と `app/package.json`（存在すれば）を走査。
- UI/peer/tsup の整合、`tsconfig` の健全性、`skipLibCheck` ガバナンスをカバーする妥当なデフォルトポリシーを適用。
- 初日から価値が得られるよう、`dep-fence.config.*` は不要。

**なぜ重要か（具体的メリット）**:
- 即時導入: CI に入れるだけで、セットアップなしに有用な検出が得られる。
- 予測可能なベースライン: どのリポでも同じデフォルトで、議論の手間を削減。
- デフォルトで安全: 読み取り専用チェック。準備ができたら `--strict` で ERROR を失敗に。
- 段階的導入: まずはリンターとして可視化、その後、例外を明文化しながら強化。
- レビューに優しい: すべての検出に “Because: …” が付くのでポリシー意図が伝わる。

---
## Basic Usage 🖥️

### レビュー用レポートを保存（重大度別にグループ化）

```bash
dep-fence -f yaml -g severity > dep-fence.report.yaml
```

リード/オーナーが ERROR と WARN を分けて確認し、レビューで共有するのに便利です。

### CI ログでエラーの要約を抽出（JSON → jq）

```bash
dep-fence -f json | jq -r '.findings[] | select(.severity=="ERROR") | "[\(.severity)] \(.packageName) :: \(.rule)"'
```

次のような簡潔な行を出力します: `[ERROR] @your/ui-button :: ui-in-deps`。

---
## Advanced Usage 💪

### Policy Configuration 🛠️

ゼロコンフィグで動作します。より詳細に制御したい場合は、リポジトリルートに明示的なポリシーファイル（`dep-fence.config.ts` または `dep-fence.config.mjs`）を置き、デフォルトを置き換えてください。

ポリシーファイル（TypeScript 例）:

```ts
// dep-fence.config.ts
import { all, isUI, isPublishable } from 'dep-fence/conditions';
import type { Policy } from 'dep-fence/types';

export const policies: Policy[] = [
  {
    id: 'ui-externals-and-peers',
    when: all(isUI(), isPublishable()),
    because: 'UI packages should not bundle React/MUI; rely on peers.',
    rules: ['ui-in-deps', 'ui-missing-peer', 'peer-in-external']
  }
];
```
各ルールの重大度は `severityOverride` で上書き可能で、`all(...)` / `any(...)` / `not(...)` で複雑な条件合成もできます。`isUI()`、`isPublishable()`、`usesTsup()` といったヘルパーも `dep-fence/conditions` から利用できます。

リポジトリ全体の運用設定（JSON）は `dep-fence.config.json` に記述できます:

```jsonc
{
  "allowSkipLibCheck": [
    "@your/legacy-chart" // 一時的な例外
  ]
}
```

パッケージ単位での `skipLibCheck` の理由付けは各 `tsconfig.json` に記述できます:

```jsonc
{
  "compilerOptions": { "skipLibCheck": true },
  "checkDeps": {
    "allowSkipLibCheck": true,
    "reason": "3rd‑party types temporary mismatch; scheduled fix"
  }
}
```

#### Policies by Example

代表的なポリシー例（目的 / スニペット / 効果）

- **Public API のみ（パッケージ横断の deep import を禁止）**
    - 目的: `@org/foo` は OK、`@org/foo/src/x` は NG。
    - スニペット:
      ```ts
      { id: 'public-api-only', when: () => true, because: 'Only use package public entrypoints.', rules: [
        { rule: 'import-path-ban', options: { forbid: ['^@[^/]+/[^/]+/src/'] }, severity: 'ERROR' },
      ]}
      ```
    - 効果: 他パッケージの `src/` 直参照を検出。

- **Peers × tsup externals の整合**
    - 目的: バンドラが peers を external として扱うことを保証。
    - スニペット:
      ```ts
      { id: 'tsup-peer-hygiene', when: isPublishable(), because: "Don't bundle peers.", rules: ['peer-in-external','external-in-deps'] }
      ```
    - 効果: `tsup.external` に不足している peer や、`dependencies` に重複して列挙された external を検出。

- **型を dist から公開することを強制**
    - 目的: 公開される型は `dist/*.d.ts` 由来であるべき。
    - スニペット:
      ```ts
      { id: 'package-types-dist', when: isPublishable(), because: 'Expose types from dist/*.d.ts.', rules: ['package-types-dist'] }
      ```
    - 効果: `types` あるいは `exports[entry].types` が `dist/*.d.ts` を指していない場合に違反。

#### Select Pre-Defined Config Files

`--config` オプションで examples ディレクトリの事前定義コンフィグを読み込めます。  
スタック/レシピ指向の例（React, Router v7, TypeScript v5, Bundlers）は `examples/README.md` を参照してください。旧 `examples/policies/` パスは廃止、スタック/レシピのパスを使用。

#### Create Your Original Config Files

独自のルールや設定をカスタマイズしたコンフィグを作成できます。

簡易例 1:
```ts
import type { Policy } from 'dep-fence/types';
import { defaultPolicies } from 'dep-fence';
import { pkgUiPeersRule, pkgExportsExistRule, tsconfigHygieneRule } from 'dep-fence/guards';

const custon: Policy[] = [
  pkgUiPeersRule({ exclude: ['@your/app'] }),
  pkgExportsExistRule({ roots: ['packages', 'app'] }),
  tsconfigHygieneRule({
    skipLibCheck: { allowedPackages: ['@your/temp-exception'], requireReasonField: true, action: 'warn' },
  }),
];

const policies: Policy[] = [...defaultPolicies, ...custom];
export default policies;
```

簡易例 2:
```ts
import type { Policy } from 'dep-fence/types';

export const policies: Policy[] = [
  {
    id: 'my-custom-checks',
    when: isPublishable(),
    because: 'repo‑specific validation',
    rules: [{
      rule: 'custom',
      id: 'check-pkg-field',
      run: (ctx) => {
        const f = [] as any[];
        if (!ctx.pkgJson.customField) {
          f.push({ packageName: ctx.pkgName, packageDir: ctx.pkgDir, rule: 'check-pkg-field', severity: 'WARN', message: 'missing customField', because: ctx.because });
        }
        return f;
      }
    }]
  }
];
```

#### Create Your Own Policies from Scratch with TS (typed, recommended) or MJS (zero‑setup)

コンフィグ形式の選択（TS / MJS）

- サポート: `dep-fence.config.ts`, `dep-fence.config.mjs`（`.mjs` の ESM を `.js` より推奨）。
- 推奨: CI/オフラインでゼロセットアップなら `.mjs`、エディタの型安全性を重視するなら `.ts`。
- `.ts` コンフィグの実行方法:
    1) 組み込みフォールバック（追加依存なし）: 型専用構文を剥がして実行。
    2) ローダ（例: `tsx`）: `NODE_OPTIONS="--loader tsx" pnpm dep-fence`。
    3) 事前ビルド（例: `tsup`）: `tsup dep-fence.config.ts --format esm --dts false --out-dir .`。
- 注意点: Node ≥ 18 の ESM が必要、CJS/ESM の混在を避ける、隔離された CI ではランタイム依存を最小化。

TS: `dep-fence.config.ts`

```ts
import { defaultPolicies } from 'dep-fence';
import type { Policy } from 'dep-fence/types';

const custom: Policy[] = [
  { id: 'ban-deep-imports', when: () => true, because: 'Use public API only; avoid cross‑package internals.', rules: [
    { rule: 'import-path-ban', options: { forbid: ['^@[^/]+/[^/]+/src/'] }, severity: 'ERROR' },
  ]},
];

export const policies: Policy[] = [...defaultPolicies, ...custom];
```

MJS: `dep-fence.config.mjs`

```js
import { defaultPolicies } from 'dep-fence';
/** @type {import('dep-fence/types').Policy[]} */
export const policies = [
  ...defaultPolicies,
  { id: 'ban-deep-imports', when: () => true, because: 'Use public API only; avoid cross‑package internals.', rules: [
    { rule: 'import-path-ban', options: { forbid: ['^@[^/]+/[^/]+/src/'] }, severity: 'ERROR' },
  ]},
];
```

#### Environment variables:
- `DEP_FENCE_CONFIG` — ポリシーモジュールへの絶対/相対パス（自動検出を上書き）。
- `DEP_FENCE_REPO_CONFIG` — リポジトリ全体の JSON 設定へのパス（`dep-fence.config.json` を上書き）。

#### Workspace/subtree overrides
- 典型的には単一のルートコンフィグ。必要に応じてサブツリー/チーム向けに `DEP_FENCE_CONFIG` で差し替え可能。

#### Performance and caching
- 小さなルールを乱立させるより、少数で広くカバーするルールを推奨。
- CI では、可能なら変更のあったパッケージに範囲を絞る。

### Git Integration: pre‑commit / pre‑push 🐙

パッケージポリシー（ゼロコンフィグ参照）に加えて、`dep-fence/guards` 配下には軽量なリポジトリレベルのガードが用意されています。Git フック向けに設計（予測可能、隠れた状態なし）。

- `allowed-dirs` — コミット対象ガード: ステージ済みファイルが許可グロブ配下にあることを要求。
- `mtime-compare` — 助言: 規約/SSOT より新しいファイルを検出。
- `upstream-conflict` — 楽観的競合検知: ベース以降に他者が保護パスを変更していれば失敗。

モノレポの公開/ビルド衛生向けの新規ガード:
- `pkg-exports-exist` — package.json の main/module/exports が実在ファイルを指すか確認（公開/バンドラ破損を防止）。
- `pkg-ui-peers` — UI シングルトンを peers として強制し、バンドラ externals を整合（`ui-in-deps`, `ui-missing-peer`, `peer-in-external`, `external-in-deps`）。
- `tsconfig-hygiene` — tsconfig の健全性（リポベース継承、JSX オプション整合、`skipLibCheck` の許可リスト/理由）。

例を試す:

```bash
pnpm dlx tsx examples/guards/run.ts --mode pre-commit
pnpm dlx tsx examples/guards/run.ts --mode pre-push

pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.ui-peers.config.ts

pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.pkg-exports.config.ts

pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.tsconfig-hygiene.config.ts

# 追加のガードプリセット（レシピと併用）
pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.ui-peer-policy.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.publishable-tsconfig-hygiene.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.jsx-option-for-tsx.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.tsconfig-paths.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.maplibre-allowlist.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.package-types-dist.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.strict-ui.config.ts
pnpm dlx tsx examples/guards/run.ts --mode pre-commit   --config examples/guards/guards.source-import-ban.config.ts
```

### CI Integration 🛡️

```yaml
# GitHub Actions example
jobs:
  dep-fence:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm i --frozen-lockfile
      - run: pnpm dep-fence  # refer to your package.json script
```

---
## Concepts & Terminology 📚

- **Rule（ルール）**
    - 最小・原子的なチェックで、検出結果（findings）を生む（例: `peer-in-external`, `source-import-ban`）。
    - ルールごとの `options` と計算済みの重大度（severity）を取り、組み込み/プラグインのいずれでも可（`create(options)=>check(ctx)`）。

- **Policy（ポリシー）**
    - 特定のパッケージ集合を対象にし、意図（Because）を説明する合成単位。
    - 形: `{ id, when, because, rules, options?, severityOverride? }` ― パッケージごとに評価。
    - 例: “UI externals and peers” は、公開可能な UI パッケージに `ui-peer-policy` ルールと `peer-in-external` ルールを束ねて適用。

- **Recipe（レシピ）**
    - 1 つの目的に特化した、すぐ動かせるポリシーモジュール。コピペで利用可能。
    - `examples/recipes/…/dep-fence.config.ts` にあり、`DEP_FENCE_CONFIG=…` で参照。

- **Guard（ガード）**
    - Git フック/CI（pre‑commit / pre‑push）向けのリポジトリレベルチェック。`examples/guards/run.ts` で実行。
    - ステージ済みファイル、tsconfig、package.json などのワークスペース状態を読み取り、ポリシー評価の外側で迅速に失敗させる。

---
## Examples 📁

最新のスタック/レシピの索引は `examples/README.md` を参照。代表的な実行例:

```bash
# 最小ポリシーセット
DEP_FENCE_CONFIG=examples/recipes/minimal/dep-fence.config.ts pnpm dep-fence

# フォーカス例（スタック/レシピのパス）
DEP_FENCE_CONFIG=examples/recipes/tsconfig-paths/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_CONFIG=examples/recipes/package-exports-guard/dep-fence.config.ts pnpm dep-fence
DEP_FENCE_CONFIG=examples/stacks/bundlers/vite/recipes/multi-entry-workers/dep-fence.config.ts pnpm dep-fence

# リポジトリ全体の JSON 設定と併用
DEP_FENCE_REPO_CONFIG=examples/repo-config/dep-fence.config.json pnpm dep-fence
```

UI ポリシー — クイックガイド:
- `ui-peer-policy`（レシピ）: package.json だけを見るチェック。導入が速く、第一歩に最適。
- `ui-peers-light`（レシピ）: 穏やかな変種。既定では WARN、バンドラチェックなし。
- `minimal`（スタック）: peers に加えて tsup の externals 整合を追加。
- `strict-ui`（レシピ）: 厳格な peers + バンドラ整合。ライブラリの CI ゲートに適切。

### What It Checks 🔍

- **Peers × tsup externals**
    - `peer-in-external`（`tsup.external` に peer がない）
    - `external-in-deps`（external が `dependencies` にもある）
- **UI パッケージ衛生**
    - `ui-in-deps`（`dependencies` に React/MUI/Emotion）
    - `ui-missing-peer`（利用している UI ライブラリが `peerDependencies` にない）
- **TypeScript 衛生**
    - `tsconfig-no-base`（リポベースを継承していない／示唆）
    - `paths-direct-src`（`../src` の直接参照）
    - `jsx-mismatch`（`.tsx` があるのに `jsx` が `react-jsx` でない）
- **`skipLibCheck` ガバナンス**
    - `skipLibCheck-not-allowed`（許可なく有効化）
    - `skipLibCheck-no-reason`（許可はあるが理由が未記載）
- **カプセル化ルール**
    - `maplibre-direct-dep`（ラッパーパッケージ以外での MapLibre 直接依存）

すべての検出には「Because: …」が含まれ、理由が可視化されます。

### Default Policies (catalog) 📚

各デフォルトポリシーは、適用理由（Because）と対象属性を説明します。

- `ui-externals-and-peers` — UI パッケージは React/MUI を同梱しない（peers を利用）。ルール: `ui-in-deps`, `ui-missing-peer`, `peer-in-external`。
- `tsup-peer-hygiene` — バンドラは peers を external 化すべき。ルール: `peer-in-external`, `external-in-deps`。
- `publishable-tsconfig-hygiene` — 公開パッケージの `tsconfig` を健全に。ルール: `tsconfig-no-base`, `paths-direct-src`。
- `publishable-local-shims` — 長期運用のローカル `*.d.ts` を避ける。ルール: `local-shims`（既定 WARN。引き上げ可）。
- `jsx-option-for-tsx` — TSX には `jsx: react-jsx` が必要。ルール: `jsx-mismatch`。
- `skipLibCheck-governance` — 理由付きの許可制トグル。ルール: `skipLibCheck-*`。
- `non-ui-paths-hygiene` — 広く cross‑src 参照を抑止。ルール: `paths-direct-src`。
- `maplibre-encapsulation` — MapLibre 依存はラッパーパッケージのみに限定。ルール: `maplibre-direct-dep`。

重大度上書きの例:

```ts
export const policies = [
  {
    id: 'ui-externals-and-peers',
    when: all(isUI(), isPublishable()),
    because: '…',
    rules: ['ui-in-deps', 'ui-missing-peer', 'peer-in-external'],
    severityOverride: { 'ui-missing-peer': 'ERROR' }
  }
];
```

### Opt‑in Extensions (examples) 🧪

追加のルールやヘルパーはポリシーファイルから有効化できます。

- `source-import-ban` — あるモジュールからの特定の名前付き import を禁止。`examples/recipes/source-import-ban/dep-fence.config.ts` を参照。
- `tsconfig-paths` — `paths` を `dist/*.d.ts` に向けさせたり、パターンを禁止したり。
- `package-exports-guard` — サブパスの保護（例: `./workers/*` の `types` を禁止）。
- `package-types-dist` — `types` と `exports[entry].types` が `dist/*.d.ts` を指すことを保証。

---
## Programmatic API 🧩

```ts
import { runWithPolicies, defaultPolicies } from 'dep-fence';
import { any, isPublishable } from 'dep-fence/conditions';

const findings = runWithPolicies(defaultPolicies);
const hasError = findings.some((f) => f.severity === 'ERROR');
```

型は `dep-fence/types` から利用できます（`Finding`, `Policy`, `Condition`, `Severity`, …）。

---
## Troubleshooting 🆘

- **パスエイリアスでの誤検出**: tsconfig の `paths` / バンドラのエイリアスに dep‑fence のリゾルバを合わせる。
- **型専用 import が誤ってフラグされる**: ルールの対象/条件を調整するか、型専用エッジを考慮するルールを使う。
- **動的 import**: 動的/計算済みパスは保守的に扱われます。重要な境界は静的パスでモデル化を。

---
## FAQ ❓

- **[ESLint](https://eslint.org) か dep‑fence か？**  
  両方です。ESLint はファイル内の品質、dep‑fence はファイル/パッケージ間の境界を強制します。

- **なぜ [dependency‑cruiser](https://github.com/sverweij/dependency-cruiser) だけではだめ？**  
  探索と可視化には最適ですが、dep‑fence はモノレポ向けの CI ファーストで少数精鋭の意見atedデフォルトに注力しています。

- **dep‑fence を使う上でのベストプラクティスは？**
    - deep import 禁止と、peers とバンドラ externals の整合のような、効果の高い簡素なルールから始める。
    - すべての例外に明確な “Because:” を付ける。段階導入には `severityOverride`（例: `WARN` → `ERROR`）を用いる。
    - CI では `--strict` で ERROR を失敗に。ローカルでは `--strict` なしで発見/レビューを進める。
    - 例外とポリシーは透明に文書化し、レビューを予測可能にして「なぜこのルールか」を周知する。

- **一時的な例外はどう許可する？**  
  スコープの狭いポリシー/条件か `severityOverride` を使い、Because（理由）を記録する。

- **公開品質はどう守る？**  
  dep‑fence（境界/型パス/peer×bundler）と [publint](https://publint.dev)（パッケージのエクスポート表面）を CI で併用する。

- **“unused dependency warning” はどこに当てはまる？**  
  いまはデフォルト提供していません。リポジトリレベルの Guard プリセットとして実装するのが最適（やや遅い場合あり）。ポリシー評価を好むならプラグイン Rule として実装も可。  
  **Guard アプローチ（推奨）**: import グラフと package.json を照合して未使用依存を検出（pre‑commit と組み合わせ）。`depcheck`/ビルドグラフツールを参照、または `guards.package-types-dist` に類似するカスタムガードを作成。  
  **Policy アプローチ**: プラグインルール `unused-deps` を追加し、公開可能パッケージのポリシーに含める。プラグインルールのドキュメントは `docs/dep-fence-upstream-guide.md` を参照。

---
## Author ✍️

Hiroya Kubo  <hiroya@cuc.ac.jp>

## License 📄

MIT

---

Happy fencing! 🧱✨ ルールに理由を添え、依存関係を健全に保ちましょう。

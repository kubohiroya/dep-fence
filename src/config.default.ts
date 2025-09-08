import type { Policy } from './types';
import { all, any, hasSkipLibCheck, isPublishable, isUI, usesTsup } from './conditions';

// デフォルトポリシー（詳細コメント付き）
// 目的: 「どの属性に該当するから、そのルールを課すのか」を常に説明できるようにする。
// 注意: UI関連の制約は公開パッケージ（publishable）にのみ適用し、アプリ（private）は除外します。

export const defaultPolicies: Policy[] = [
  // UIパッケージはReact/MUIをバンドルせず、ホストアプリの単一インスタンスに寄りかかる
  {
    id: 'ui-externals-and-peers',
    // アプリは除外したいので isUI && isPublishable
    when: all(isUI(), isPublishable()),
    because: 'UIパッケージはReact/MUI等をバンドルせず、ホスト側の単一インスタンス（peer）に依存すべきため。',
    rules: [
      // 依存（dependencies）に置かない
      'ui-in-deps',
      // インストールしているが peer に載っていない
      'ui-missing-peer',
      // peerDependencies ⊆ tsup.external を担保
      'peer-in-external',
    ],
  },

  // tsup利用パッケージはpeerを必ずexternalにする（多重バンドル防止）
  {
    id: 'tsup-peer-hygiene',
    when: usesTsup(),
    because: 'tsupでバンドルするパッケージはpeer依存を必ずexternalにして多重バンドルを防ぐため。',
    rules: [
      'peer-in-external',
      // external 指定なのに dependencies にもある→peerへ移行を促す
      'external-in-deps',
    ],
  },

  // 公開パッケージのTypeScript構成の衛生: ベース継承と../src参照禁止
  {
    id: 'publishable-tsconfig-hygiene',
    when: isPublishable(),
    because: '公開物はリポジトリ標準のtsconfigを継承し、他パッケージの../srcを直参照しないため。',
    rules: [
      'tsconfig-no-base',
      'paths-direct-src',
    ],
  },

  // 公開パッケージではローカル型シム（*.d.ts）を極力避ける（やむを得ない場合は短期運用）
  {
    id: 'publishable-local-shims',
    when: isPublishable(),
    because: '配布物の型安全性と将来の保守性のため、ローカル型シムの恒常化を避けるため。',
    rules: ['local-shims'],
    // 当面はWARN。段階的にERRORへ引き上げ可。
    severityOverride: { 'local-shims': 'WARN' },
  },

  // TSXがあるならjsx: react-jsx を明示
  {
    id: 'jsx-option-for-tsx',
    when: all(isPublishable(), isUI()),
    because: 'TSXソースの型推論とJSX emit整合のため、jsx: react-jsx を推奨/要求するため。',
    rules: ['jsx-mismatch'],
  },

  // skipLibCheckの統制（原則禁止、やむを得ない場合は理由が必要）
  {
    id: 'skipLibCheck-governance',
    when: hasSkipLibCheck(),
    because: 'skipLibCheckは型の負債トグルであり、恒常化を防ぐために理由の明示 or 例外登録が必要なため。',
    rules: [
      // 許可なく有効化
      'skipLibCheck-not-allowed',
      // 許可はあるが理由未記載
      'skipLibCheck-no-reason',
    ],
  },

  // UI以外（Node/ツール系）でも ../src 直参照はリリース品質を下げるので抑止（緩め）
  {
    id: 'non-ui-paths-hygiene',
    when: any(isPublishable()),
    because: 'ビルド成果物の安定性のため、公開物では他パッケージの../src直参照を避けるため。',
    rules: ['paths-direct-src'],
  },

  // MapLibre カプセル化ポリシー: maplibre-gl/@vis.gl/react-maplibre は ui-map 以外で直接依存禁止
  {
    id: 'maplibre-encapsulation',
    when: any(isPublishable()),
    because: 'MapLibre の型/実装差分は @hierarchidb/ui-map で吸収し、下位パッケージへ漏らさないため。',
    rules: ['maplibre-direct-dep'],
  },
];

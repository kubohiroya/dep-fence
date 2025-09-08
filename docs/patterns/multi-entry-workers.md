# Pattern: Multi‑Entry Packages + Worker Subpaths

目的: `./ui` / `./worker` 等の複数エントリを公開しつつ、`./workers/*` は JS のみ公開（types は公開しない）、型はメイン API から提供する運用を安定化します。

推奨ルール（opt‑in）
- `package-exports-guard` with `{ subpathPattern: '^\\./workers/', forbidFields: ['types'] }`
- `package-types-dist` with `{ requireDistForEntries: ['.', './ui', './worker'] }`
- `tsconfig-paths` with `{ allowPattern: '.*/dist/.*\\.d\\.ts', forbidPattern: '/src/' }`

サンプル `package.json`
```jsonc
{
  "name": "@your/pkg",
  "types": "dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.mjs" },
    "./ui": { "types": "./dist/ui.d.ts", "default": "./dist/ui.mjs" },
    "./worker": { "types": "./dist/worker.d.ts", "default": "./dist/worker.mjs" },
    "./workers/my-worker": { "default": "./dist/workers/my-worker.mjs" }
  }
}
```

ポリシー断片
```ts
import { isPublishable, any } from 'dep-fence/conditions';
import type { Policy } from 'dep-fence/types';

export const policies: Policy[] = [
  {
    id: 'workers-js-only',
    when: any(isPublishable()),
    because: 'Worker エントリは JS のみ公開（型はメイン API から提供）',
    rules: ['package-exports-guard'],
    options: {
      'package-exports-guard': { subpathPattern: '^\\./workers/', forbidFields: ['types'] }
    }
  },
  {
    id: 'types-point-to-dist',
    when: any(isPublishable()),
    because: '型は dist/*.d.ts へ集約しビルド前解決を安定化',
    rules: ['package-types-dist'],
    options: {
      'package-types-dist': { requireDistForEntries: ['.', './ui', './worker'] }
    }
  }
];
```

ロールバック
- いずれも既定OFF。問題があれば一時的にポリシーから取り外すか `severityOverride` を `WARN` に。

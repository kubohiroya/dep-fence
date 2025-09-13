import { strict as assert } from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { RuleContext, RuleRunner } from '../src/rules';
import type { Finding } from '../src/types';
import { create as createUiPeerPolicy } from '../src/rules-plugins/uiPeerPolicy';
import { create as createMapLibreAllowlist } from '../src/rules-plugins/maplibreAllowlist';

function ctxFromFixture(fixDir: string, because?: string): RuleContext {
  const pkgPath = path.join(fixDir, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const pkgName = pkgJson.name || path.basename(fixDir);
  return {
    pkgName,
    pkgDir: fixDir,
    pkgJson,
    defaultsExternals: [],
    allowSkipLibCheck: new Set<string>(),
    because,
  } as RuleContext;
}

type Case = {
  name: string;
  runner: RuleRunner;
  fixture: string;
  expectRules: string[]; // order-insensitive
};

function runCase(c: Case) {
  const ctx = ctxFromFixture(path.join(__dirname, 'fixtures', c.fixture));
  const findings: Finding[] = c.runner(ctx);
  const got = findings.map(f => f.rule).sort();
  const exp = [...c.expectRules].sort();
  try {
    assert.deepEqual(got, exp);
    console.log(`OK   ${c.name}`);
  } catch (e) {
    console.error(`FAIL ${c.name}`);
    console.error(' expected:', exp);
    console.error(' got     :', got);
    if (findings.length) {
      for (const f of findings) console.error(`  - ${f.rule}: ${f.message.split('\n')[0]}`);
    }
    throw e;
  }
}

const uiPeer = createUiPeerPolicy();
const maplibre = createMapLibreAllowlist();

const cases: Case[] = [
  { name: 'uiPeer OK peers-only', runner: uiPeer, fixture: 'uiPeer/ok-peers-only', expectRules: [] },
  { name: 'uiPeer NG in deps', runner: uiPeer, fixture: 'uiPeer/ng-in-deps', expectRules: ['ui-in-deps'] },
  { name: 'uiPeer NG missing peer', runner: uiPeer, fixture: 'uiPeer/ng-missing-peer', expectRules: ['ui-missing-peer'] },
  { name: 'maplibre OK allow wrapper', runner: maplibre, fixture: 'maplibre/ok-allow', expectRules: [] },
  { name: 'maplibre NG direct dep', runner: maplibre, fixture: 'maplibre/ng-direct', expectRules: ['maplibre-direct-dep'] },
];

let failed = 0;
for (const c of cases) {
  try { runCase(c); } catch { failed++; }
}
if (failed) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} tests passed.`);


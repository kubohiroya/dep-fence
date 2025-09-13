import { strict as assert } from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { create as createUiPeerPolicy } from '../dist/rules-plugins/uiPeerPolicy.mjs';
import { create as createMapLibreAllowlist } from '../dist/rules-plugins/maplibreAllowlist.mjs';

function ctxFromFixture(fixDir, because) {
  const pkgPath = path.join(fixDir, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const pkgName = pkgJson.name || path.basename(fixDir);
  return {
    pkgName,
    pkgDir: fixDir,
    pkgJson,
    defaultsExternals: [],
    allowSkipLibCheck: new Set(),
    because,
  };
}

function runCase(name, runner, fixtureRel, expectRules) {
  const fix = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', fixtureRel);
  const ctx = ctxFromFixture(fix);
  const findings = runner(ctx);
  const got = findings.map((f) => f.rule).sort();
  const exp = [...expectRules].sort();
  try {
    assert.deepEqual(got, exp);
    console.log(`OK   ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`);
    console.error(' expected:', exp);
    console.error(' got     :', got);
    for (const f of findings) console.error(`  - ${f.rule}: ${String(f.message).split('\n')[0]}`);
    throw e;
  }
}

const uiPeer = createUiPeerPolicy();
const maplibre = createMapLibreAllowlist();

const cases = [
  ['uiPeer OK peers-only', uiPeer, 'uiPeer/ok-peers-only', []],
  ['uiPeer NG in deps', uiPeer, 'uiPeer/ng-in-deps', ['ui-in-deps', 'ui-missing-peer']],
  ['uiPeer NG missing peer', uiPeer, 'uiPeer/ng-missing-peer', ['ui-missing-peer']],
  ['maplibre OK allow wrapper', maplibre, 'maplibre/ok-allow', []],
  ['maplibre NG direct dep', maplibre, 'maplibre/ng-direct', ['maplibre-direct-dep']],
];

let failed = 0;
for (const c of cases) {
  try { runCase(...c); } catch { failed++; }
}
if (failed) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} tests passed.`);

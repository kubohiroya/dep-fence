import type { Finding } from './types';

export function printFindings(findings: Finding[]) {
  if (!findings.length) {
    console.log('All packages passed policy checks.');
    return;
  }
  const byPkg = groupBy(findings, (f) => f.packageName);
  for (const [pkg, fs] of byPkg) {
    console.log(`\n=== ${pkg} ===`);
    for (const f of fs) {
      const head = `${f.severity} ${f.rule}`;
      const because = f.because ? `\nBecause: ${f.because}` : '';
      console.log(`${head}: ${f.message}${because}`);
    }
  }
}

export function findingsToJson(findings: Finding[]) {
  return JSON.stringify({ findings }, null, 2);
}

function groupBy<T, K>(arr: T[], key: (x: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const x of arr) {
    const k = key(x);
    const v = m.get(k);
    if (v) v.push(x); else m.set(k, [x]);
  }
  return m;
}

import type { Finding } from './types';
import yaml from 'yaml';

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

export function findingsToYamlByRule(findings: Finding[]) {
  if (!findings.length) return yaml.stringify({ result: 'All packages passed policy checks.' });
  const byRule = groupBy(findings, (f) => f.rule);
  const out: Record<string, any[]> = {};
  for (const [rule, fs] of byRule) {
    out[rule] = fs.map(f => {
      const entry: any = {
        package: f.packageName,
        severity: f.severity,
        message: f.message,
      };
      if (f.because) entry.reason = f.because;
      return entry;
    });
  }
  return yaml.stringify(out);
}

export function findingsToYaml(findings: Finding[]) {
  if (!findings.length) return yaml.stringify({ result: 'All packages passed policy checks.' });
  const byPkg = groupBy(findings, (f) => f.packageName);
  const out: Record<string, any[]> = {};
  for (const [pkg, fs] of byPkg) {
    out[pkg] = fs.map(f => {
      const entry: any = {
        type: f.rule,
        severity: f.severity,
        message: f.message,
      };
      if (f.because) entry.reason = f.because;
      return entry;
    });
  }
  return yaml.stringify(out);
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

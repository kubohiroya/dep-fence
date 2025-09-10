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

export function findingsToYaml(findings: Finding[]) {
  if (!findings.length) {
    return 'findings: []\n';
  }
  
  const yaml = ['findings:'];
  
  for (const finding of findings) {
    yaml.push('  - packageName: ' + yamlString(finding.packageName));
    yaml.push('    packageDir: ' + yamlString(finding.packageDir));
    yaml.push('    rule: ' + yamlString(finding.rule));
    yaml.push('    severity: ' + yamlString(finding.severity));
    yaml.push('    message: ' + yamlString(finding.message));
    if (finding.because) {
      yaml.push('    because: ' + yamlString(finding.because));
    }
  }
  
  return yaml.join('\n') + '\n';
}

function yamlString(str: string): string {
  // Handle simple cases without quotes if possible
  if (/^[a-zA-Z0-9_-]+$/.test(str)) {
    return str;
  }
  
  // Escape quotes and wrap in double quotes for complex strings
  return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
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

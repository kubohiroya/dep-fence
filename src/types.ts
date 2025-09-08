export type Severity = 'INFO' | 'WARN' | 'ERROR';

export interface Finding {
  packageName: string;
  packageDir: string;
  rule: string;
  severity: Severity;
  message: string;
  because?: string;
}

export interface RepoConfig {
  allowSkipLibCheck: string[];
  allowlist?: AllowlistEntry[];
}

export interface PackageMeta {
  name: string;
  dir: string;
  pkgJson: any;
  tsconfig: any;
  externals: string[];
  deps: Set<string>;
  peers: Set<string>;
  devs: Set<string>;
  attrs: Set<string>;
}

export type Condition = (m: PackageMeta) => { ok: boolean; because?: string };

export interface CustomRule {
  rule: 'custom';
  id?: string; // optional identifier for reporting/severityOverride
  run: (ctx: any) => Finding[];
}

export interface Policy {
  id: string;
  when: Condition;
  because: string;
  rules: (string | CustomRule)[];
  severityOverride?: Partial<Record<string, Severity>>;
  // Optional per-rule options: key is rule id
  options?: Record<string, any>;
}

export interface AllowlistEntry {
  ruleId: string;
  package: string; // package name
  because: string;
}

export interface RunOptions {
  onlyRules?: Set<string>;
  skipRules?: Set<string>;
  requireAttrs?: Set<string>;
  sinceRef?: string; // git ref for change scope limiting
}

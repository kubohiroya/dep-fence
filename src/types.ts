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

export interface Policy {
  id: string;
  when: Condition;
  because: string;
  rules: string[];
  severityOverride?: Partial<Record<string, Severity>>;
}


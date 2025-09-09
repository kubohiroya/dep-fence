export type GuardMode = 'pre-commit' | 'pre-push' | 'manual';

export interface GuardContext {
  mode: GuardMode;
  cwd: string;
  warn(name: string, payload: { message: string; files?: string[]; meta?: Record<string, unknown> }): void;
  fail(name: string, payload: { message: string; files?: string[]; meta?: Record<string, unknown> }): void;
}

export interface Rule {
  name: string;
  run(ctx: GuardContext): Promise<void> | void;
}


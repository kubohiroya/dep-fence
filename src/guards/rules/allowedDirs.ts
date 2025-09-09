import type { Rule } from '../types.js';
import { compile, matches } from '../utils/glob.js';
import { gitStagedFiles } from '../utils/git.js';

export type AllowedDirsOptions = { allow: string[]; action?: 'error' | 'warn' };

export function allowedDirsRule(opts: AllowedDirsOptions): Rule {
  const { allow, action = 'error' } = opts;
  const allowSet = compile(allow);
  return {
    name: 'allowed-dirs',
    async run(ctx) {
      const staged = gitStagedFiles(ctx.cwd).map((f) => f.replace(/\\/g, '/'));
      if (!staged.length) return;
      const outside = staged.filter((f) => !matches(f, allowSet));
      if (outside.length) {
        const message = 'Staged files outside allowed directories were found.';
        if (action === 'warn') ctx.warn('allowed-dirs', { message, files: outside });
        else ctx.fail('allowed-dirs', { message, files: outside });
      }
    },
  };
}


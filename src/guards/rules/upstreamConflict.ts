import type { Rule } from '../types.js';
import { compile, matches } from '../utils/glob.js';
import {
  gitUpstream,
  gitMergeBase,
  gitRevListExclusive,
  gitCommitAuthorEmail,
  gitCommitChangedFiles,
  gitUserEmail,
} from '../utils/git.js';

export type UpstreamConflictOptions = {
  watch: string[];
  baseRef?: string;
  allowedAuthors?: string[];
  action?: 'error' | 'warn';
};

export function upstreamConflictRule(opts: UpstreamConflictOptions): Rule {
  const { watch, baseRef, allowedAuthors, action = 'error' } = opts;
  const watchSet = compile(watch);
  return {
    name: 'upstream-conflict',
    async run(ctx) {
      const upstream = baseRef || gitUpstream(ctx.cwd) || 'origin/main';
      const base = gitMergeBase('HEAD', upstream, ctx.cwd);
      if (!base) return;

      const commits = gitRevListExclusive(base, upstream, ctx.cwd);
      if (!commits.length) return;

      const me = (gitUserEmail(ctx.cwd) || '').toLowerCase();
      const allow = new Set(
        (allowedAuthors && allowedAuthors.length ? allowedAuthors : (me ? [me] : []))
          .map((s) => s.toLowerCase())
      );

      const offenders: string[] = [];
      for (const c of commits) {
        const author = (gitCommitAuthorEmail(c, ctx.cwd) || '').toLowerCase();
        if (allow.has(author)) continue;
        const files = gitCommitChangedFiles(c, ctx.cwd).map((f) => f.replace(/\\/g, '/'));
        if (files.some((f) => matches(f, watchSet))) offenders.push(c);
      }

      if (offenders.length) {
        const message = `Upstream has commits by other authors touching protected files since base (${upstream}).`;
        if (action === 'warn') ctx.warn('upstream-conflict', { message, files: offenders });
        else ctx.fail('upstream-conflict', { message, files: offenders });
      }
    },
  };
}


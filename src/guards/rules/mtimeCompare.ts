import fs from 'node:fs';
import path from 'node:path';
import type { Rule } from '../types.js';
import { compile, matches } from '../utils/glob.js';
import { gitTrackedFiles } from '../utils/git.js';

export type MtimeCompareOptions = {
  groupA: string[];
  groupB: string[];
  action?: 'error' | 'warn';
  epsilonMs?: number;
  onlyTracked?: boolean;
};

export function mtimeCompareRule(opts: MtimeCompareOptions): Rule {
  const { groupA, groupB, action = 'error', epsilonMs = 1500, onlyTracked = true } = opts;
  const setA = compile(groupA);
  const setB = compile(groupB);

  return {
    name: 'mtime-compare',
    async run(ctx) {
      const files = (onlyTracked ? gitTrackedFiles(ctx.cwd) : gitTrackedFiles(ctx.cwd))
        .map((f) => f.replace(/\\/g, '/'));

      let maxB = Number.NEGATIVE_INFINITY;
      for (const rel of files) {
        if (!matches(rel, setB)) continue;
        try {
          const t = fs.statSync(path.join(ctx.cwd, rel)).mtimeMs;
          if (Number.isFinite(t)) maxB = Math.max(maxB, t);
        } catch { /* ignore */ }
      }
      if (!Number.isFinite(maxB)) return;

      const newerA: string[] = [];
      for (const rel of files) {
        if (!matches(rel, setA)) continue;
        try {
          const t = fs.statSync(path.join(ctx.cwd, rel)).mtimeMs;
          if (Number.isFinite(t) && t > maxB + epsilonMs) newerA.push(rel);
        } catch { /* ignore */ }
      }
      if (newerA.length) {
        const message = `Files in groupA are newer than groupB (maxB=${new Date(maxB).toISOString()}).`;
        if (action === 'warn') ctx.warn('mtime-compare', { message, files: newerA, meta: { maxB, epsilonMs } });
        else ctx.fail('mtime-compare', { message, files: newerA, meta: { maxB, epsilonMs } });
      }
    },
  };
}


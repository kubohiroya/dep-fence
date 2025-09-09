import { spawnSync } from 'node:child_process';

export function git(args: string[], cwd = process.cwd()) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (res.status !== 0) throw new Error(res.stderr || `git ${args.join(' ')} failed`);
  return res.stdout || '';
}

export function gitTry(args: string[], cwd = process.cwd()) {
  try { return git(args, cwd); } catch { return ''; }
}

export function gitTrackedFiles(cwd = process.cwd()): string[] {
  return git(['ls-files', '-z'], cwd).split('\u0000').filter(Boolean);
}

export function gitStagedFiles(cwd = process.cwd()): string[] {
  return gitTry(['diff', '--name-only', '--cached'], cwd).split('\n').filter(Boolean);
}

export function gitUpstream(cwd = process.cwd()): string | null {
  return gitTry(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], cwd).trim() || null;
}

export function gitMergeBase(a: string, b: string, cwd = process.cwd()): string | null {
  return gitTry(['merge-base', a, b], cwd).trim() || null;
}

export function gitRevListExclusive(ancestor: string, head: string, cwd = process.cwd()): string[] {
  return gitTry(['rev-list', '--no-merges', `${ancestor}..${head}`], cwd).split('\n').filter(Boolean);
}

export function gitCommitAuthorEmail(commit: string, cwd = process.cwd()): string | null {
  return gitTry(['show', '-s', '--format=%ae', commit], cwd).trim() || null;
}

export function gitCommitChangedFiles(commit: string, cwd = process.cwd()): string[] {
  return gitTry(['diff', '--name-only', `${commit}^!`], cwd).split('\n').filter(Boolean);
}

export function gitUserEmail(cwd = process.cwd()): string | null {
  return gitTry(['config', 'user.email'], cwd).trim() || null;
}


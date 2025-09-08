import type { Condition, PackageMeta } from './types';

export function has(tag: string): Condition {
  return (m: PackageMeta) => ({ ok: m.attrs.has(tag), because: `packages with attribute '${tag}'` });
}

export function not(c: Condition): Condition {
  return (m: PackageMeta) => {
    const r = c(m);
    return { ok: !r.ok, because: `not (${r.because || 'condition'})` };
  };
}

export function all(...conds: Condition[]): Condition {
  return (m: PackageMeta) => {
    const rs = conds.map((c) => c(m));
    const ok = rs.every((r) => r.ok);
    const because = rs.map((r) => r.because).filter(Boolean).join(' & ');
    return { ok, because };
  };
}

export function any(...conds: Condition[]): Condition {
  return (m: PackageMeta) => {
    const rs = conds.map((c) => c(m));
    const ok = rs.some((r) => r.ok);
    const because = rs.filter((r) => r.ok).map((r) => r.because).filter(Boolean).join(' | ');
    return { ok, because };
  };
}

export const isUI = () => has('ui');
export const isPublishable = () => has('publishable');
export const usesTsup = () => has('usesTsup');
export const hasTsx = () => has('hasTsx');
export const isBrowser = () => has('browser');
export const isNode = () => has('node');
export const isWorker = () => has('worker');
export const hasSkipLibCheck = () => has('skipLibCheck');

export interface GlobSet { include: RegExp[]; exclude: RegExp[] }

export function toRegex(glob: string): RegExp {
  let re = '^';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        while (glob[i + 1] === '*') i++;
        if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; }
        else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '.') re += '\\.';
    else if ('+^$()[]{}|'.includes(c)) re += '\\' + c;
    else re += c;
    i++;
  }
  re += '$';
  return new RegExp(re);
}

export function compile(globs: string[]): GlobSet {
  const include: RegExp[] = [];
  const exclude: RegExp[] = [];
  for (const g of globs) {
    if (!g) continue;
    if (g.startsWith('!')) exclude.push(toRegex(g.slice(1)));
    else include.push(toRegex(g));
  }
  return { include, exclude };
}

export function matches(path: string, set: GlobSet): boolean {
  const p = path.replace(/\\/g, '/');
  let inc = false;
  for (const r of set.include) if (r.test(p)) { inc = true; break; }
  if (!inc) return false;
  for (const r of set.exclude) if (r.test(p)) return false;
  return true;
}


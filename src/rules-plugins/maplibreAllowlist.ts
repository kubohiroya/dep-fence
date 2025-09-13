import type { Finding, Severity } from '../types';
import type { RuleRunner } from '../rules';

export interface MapLibreAllowlistOptions {
  libs?: string[]; // maplibre related package names
  allow?: string[]; // packages allowed to depend on libs
  severity?: Severity; // default 'ERROR'
}

const DEFAULT_LIBS = ['maplibre-gl', '@vis.gl/react-maplibre'];

export function create(options: MapLibreAllowlistOptions = {}): RuleRunner {
  const libs = new Set(options.libs && options.libs.length ? options.libs : DEFAULT_LIBS);
  const allow = new Set(options.allow || ['@hierarchidb/ui-map']);
  const severity: Severity = options.severity || 'ERROR';

  return function check(ctx): Finding[] {
    const f: Finding[] = [];
    if (allow.has(ctx.pkgName)) return f;
    const deps = new Set([
      ...Object.keys(ctx.pkgJson.dependencies || {}),
      ...Object.keys(ctx.pkgJson.peerDependencies || {}),
      ...Object.keys(ctx.pkgJson.devDependencies || {}),
    ]);
    const offenders = [...libs].filter((p) => deps.has(p));
    if (offenders.length) {
      f.push({
        packageName: ctx.pkgName,
        packageDir: ctx.pkgDir,
        rule: 'maplibre-direct-dep',
        severity,
        message: `Direct dependency on MapLibre stack is not allowed. Use wrapper instead. Found:\n- ${offenders.join('\n- ')}`,
        because: ctx.because,
      });
    }
    return f;
  };
}


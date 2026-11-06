import path from "node:path";

/** tsconfig의 baseUrl·paths를 일반 데이터로 읽은 것(코드를 import하지 않는다). baseUrl은 root 상대("" = root) */
export interface ResolverConfig {
  baseUrl: string;
  paths: Record<string, string[]>;
}

const EXT = /\.(?:tsx|ts|jsx|js|mjs|cjs)$/;

/** root 상대 POSIX 경로에서 확장자와 끝의 `/index`를 뗀다 */
export function moduleKey(p: string): string {
  let out = path.posix.normalize(p).replace(/^\.\//, "").replace(EXT, "");
  if (out.endsWith("/index")) out = out.slice(0, -"/index".length);
  return out;
}

/**
 * import 지정자 → root 상대 모듈 경로(확장자·index 없음). 로컬이 아니면(패키지) null.
 * 상대 경로(`./`·`../`)와 tsconfig paths 별칭(`@/*`)만 로컬로 본다. root 밖으로 나가는 경로도 null.
 */
export function resolveLocal(fromFile: string, spec: string, config: ResolverConfig): string | null {
  let resolved: string | null = null;
  if (spec.startsWith("./") || spec.startsWith("../") || spec === "." || spec === "..") {
    resolved = path.posix.join(path.posix.dirname(fromFile), spec);
  } else {
    for (const [pattern, targets] of Object.entries(config.paths)) {
      const target = targets[0];
      if (target === undefined) continue;
      const star = pattern.indexOf("*");
      if (star === -1) {
        if (spec === pattern) resolved = path.posix.join(config.baseUrl, target);
      } else {
        const prefix = pattern.slice(0, star);
        const suffix = pattern.slice(star + 1);
        if (spec.startsWith(prefix) && spec.endsWith(suffix) && spec.length >= prefix.length + suffix.length) {
          const rest = spec.slice(prefix.length, spec.length - suffix.length);
          resolved = path.posix.join(config.baseUrl, target.replace("*", rest));
        }
      }
      if (resolved !== null) break;
    }
  }
  if (resolved === null) return null;
  const key = moduleKey(resolved);
  return key.startsWith("../") || key === ".." || path.posix.isAbsolute(key) ? null : key;
}

/** resolved(확장자·index 없는 경로)가 DS 모듈 디렉터리·파일 중 하나이거나 그 아래인가 */
export function isDsModule(resolved: string, dsModules: readonly string[]): boolean {
  for (const raw of dsModules) {
    const m = moduleKey(raw);
    if (resolved === m || resolved.startsWith(`${m}/`)) return true;
  }
  return false;
}

import type { StyleUsage } from "@dsmith-dev/extractor-api";
import { moduleKeyOf, type ModuleContext } from "../index/component-usage.js";
import type { TsPaths } from "../index/specifier.js";
import type { Token } from "../model/token.js";

/** 한 usage의 `ref`가 가리키는 JS 토큰. 없으면 null */
export type RefResolver = (file: string, usage: StyleUsage) => Token | null;

function keyOf(module: string, exportName: string, path: readonly string[]): string {
  return [module, exportName, ...path].join("\u0000");
}

/**
 * JS 토큰 참조 판정의 유일한 자리. `usage.ref`(지정자·import 이름·경로)를 module 키(`moduleKeyOf`, tsconfig paths 포함)로 토큰의 `js`와 맞춘다.
 * named import는 `imported`가 export 이름, namespace(`*`)는 `path[0]`이 export, default는 `"default"`.
 * 스프레드(`...typography.caption`)는 `path + ["fontSize"]` 토큰을 찾는다. 계산 접근처럼 `ref`가 없는 사용은 null.
 */
export function buildTokenRefResolver(
  tokens: Token[],
  env: { tsPaths: TsPaths | null; moduleContext: ModuleContext },
): RefResolver {
  const byKey = new Map<string, Token>();
  for (const token of tokens) {
    if (token.js === undefined) continue;
    const key = keyOf(token.js.module, token.js.export, token.js.path);
    if (!byKey.has(key)) byKey.set(key, token);
  }
  if (byKey.size === 0) return () => null;

  const moduleKeys = new Map<string, string>();
  return (file, usage) => {
    const ref = usage.ref;
    if (ref === undefined) return null;
    const cacheKey = `${file}\u0000${ref.specifier}`;
    let module = moduleKeys.get(cacheKey);
    if (module === undefined) {
      module = moduleKeyOf(file, ref.specifier, env.tsPaths, env.moduleContext);
      moduleKeys.set(cacheKey, module);
    }
    let exportName = ref.imported;
    let path = ref.path;
    if (ref.imported === "*") {
      const [first, ...rest] = ref.path;
      if (first === undefined) return null;
      exportName = first;
      path = rest;
    }
    if (ref.spread === true) path = [...path, "fontSize"];
    return byKey.get(keyOf(module, exportName, path)) ?? null;
  };
}

/**
 * 치환 대상 토큰. 모드(light/dark) 토큰은 항상 뺀다 — `#fff`를 `Colors.light.background`로 바꾸면 다크 모드가 깨진다.
 * JS 토큰은 프레임워크가 react-native이거나 비-JS 토큰이 하나도 없을 때만 포함한다(웹 레포는 CSS·DTCG 토큰만).
 */
export function replacementCandidates<T extends Token>(tokens: T[], opts: { framework: string }): T[] {
  const usable = tokens.filter((t) => t.js?.mode === undefined);
  const includeJs = opts.framework === "react-native" || !usable.some((t) => t.js === undefined);
  return includeJs ? usable : usable.filter((t) => t.js === undefined);
}

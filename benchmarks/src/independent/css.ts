import postcss from "postcss";
import { declarationOccurrences } from "./scan.js";
import type { Occurrence } from "./types.js";

/** CSS 파일의 선언에서 색·길이·var 등장을 모은다. `@media` 조건 등 at-rule 인자는 보지 않는다. 문법 오류면 던진다 */
export function scanCss(code: string): Occurrence[] {
  const root = postcss.parse(code);
  const out: Occurrence[] = [];
  root.walkDecls((decl) => {
    out.push(...declarationOccurrences(decl.prop, decl.value));
  });
  return out;
}

/** CSS 한 파일이 선언한 커스텀 속성 이름(`--name:`). 파싱이 실패하면 정규식으로 대신한다 */
export function declaredCustomProperties(code: string): string[] {
  const names = new Set<string>();
  try {
    postcss.parse(code).walkDecls((decl) => {
      if (decl.prop.startsWith("--")) names.add(decl.prop);
    });
  } catch {
    const stripped = code.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of stripped.matchAll(/(?:^|[;{\s])(--[A-Za-z0-9_-]+)\s*:/g)) if (m[1] !== undefined) names.add(m[1]);
  }
  return [...names];
}

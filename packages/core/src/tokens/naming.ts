/**
 * 토큰 CSS 변수 이름 규칙 — 이름의 유일한 출처.
 * "ds": `--ds-color-blue-400`(Tailwind 4 기본 테마 변수 `--color-*`·`--text-*`·`--radius-*`와 겹치지 않음)
 * "legacy": 접두 없는 `--color-blue-400`(0.3.0까지의 init 산출)
 * 순수 함수만 둔다(fs 없음).
 */
import type { DraftGroup } from "./draft.js";

export type TokenNaming = "ds" | "legacy";
export const DS_CSS_PREFIX = "ds";
export const DEFAULT_TOKEN_NAMING: TokenNaming = "ds";

/** ("color","blue-400","ds") → "--ds-color-blue-400", legacy → "--color-blue-400" */
export function cssVarName(group: DraftGroup, key: string, naming: TokenNaming): string {
  return naming === "ds" ? `--${DS_CSS_PREFIX}-${group}-${key}` : `--${group}-${key}`;
}

const DS_PREFIX_RE = new RegExp(`^--${DS_CSS_PREFIX}-`);

/** "--ds-color-blue-400" | "--color-blue-400" → "color-blue-400"(접두·"--" 제거) */
export function semanticNameOf(cssVar: string): string {
  return cssVar.replace(DS_PREFIX_RE, "").replace(/^--/, "");
}

const FIRST_DECLARATION = /(?:^|[{;\s])(--[A-Za-z0-9_-]+)\s*:/;

/**
 * init 소유 토큰 파일 텍스트로 형식 판정. json(있으면 우선): 루트 $extensions["dev.dsmith"].cssPrefix === "ds" → "ds", 파싱되면 그 밖은 "legacy".
 * css: 첫 `--` 선언 이름이 "--ds-"로 시작 → "ds", 선언이 있으면 "legacy". 둘 다 판정 불가면 null
 */
export function detectNamingFromFiles(files: { json: string | null; css: string | null }): TokenNaming | null {
  if (files.json !== null) {
    try {
      const root: unknown = JSON.parse(files.json);
      if (typeof root === "object" && root !== null && !Array.isArray(root)) {
        const ext = (root as Record<string, unknown>).$extensions;
        const dsmith =
          typeof ext === "object" && ext !== null ? (ext as Record<string, unknown>)["dev.dsmith"] : undefined;
        const prefix =
          typeof dsmith === "object" && dsmith !== null ? (dsmith as Record<string, unknown>).cssPrefix : undefined;
        return prefix === DS_CSS_PREFIX ? "ds" : "legacy";
      }
    } catch {
      // 깨진 json — css로 판정
    }
  }
  if (files.css !== null) {
    const m = FIRST_DECLARATION.exec(files.css.replace(/\/\*[\s\S]*?\*\//g, ""));
    if (m !== null) return DS_PREFIX_RE.test(m[1] as string) ? "ds" : "legacy";
  }
  return null;
}

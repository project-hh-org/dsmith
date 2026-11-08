import type { DraftGroup, DraftToken, TokenDraft } from "./draft.js";
import { jsKeyOf } from "./js-theme.js";

export const GENERATED_NOTICE =
  "dsmith init이 생성한 파일입니다. 직접 고치면 다음 init이 덮어쓰지 않습니다(--force로 덮어씀).";

const GROUPS = ["color", "space", "radius", "text"] as const;

/** `:root { --color-gray-50: #ffffff; … }` — draft 순서 그대로 */
export function emitTokensCss(draft: TokenDraft): string {
  const lines = draft.tokens.map((t) => `  ${t.cssVar}: ${t.value};`);
  return `/* ${GENERATED_NOTICE} */\n:root {\n${lines.join("\n")}\n}\n`;
}

/** RN `tokens.ts`의 export 이름. 그룹 color → colors, space → spacing, radius → radius, text → fontSize */
const RN_EXPORT: Record<DraftGroup, string> = { color: "colors", space: "spacing", radius: "radius", text: "fontSize" };

/**
 * RN 형식 `tokens.ts` — `export const colors/spacing/radius/fontSize = { … } as const;`(빈 그룹 생략).
 * 색은 "#rrggbb" 문자열, 길이는 단위 없는 number(dp), 키는 `jsKeyOf`(`blue-400` → `blue400`, 숫자 키 `2`는 그대로).
 * `readJsThemeTokens`가 다시 읽으면 초안과 (category, normalized)가 같다.
 */
export function emitTokensTsRn(draft: TokenDraft): string {
  const blocks: string[] = [];
  for (const group of GROUPS) {
    const entries = draft.tokens.filter((t) => t.group === group);
    if (entries.length === 0) continue;
    const lines = entries.map((t) => {
      const value = t.normalized.kind === "length" ? String(t.normalized.px) : JSON.stringify(t.value);
      return `  ${jsKeyOf(t.key)}: ${value},`;
    });
    blocks.push(`export const ${RN_EXPORT[group]} = {\n${lines.join("\n")}\n} as const;\n`);
  }
  return `// ${GENERATED_NOTICE}\n${blocks.join("\n")}`;
}

/** RN `tokens.ts`에서 이 토큰을 쓰는 식: `colors.blue400`, 숫자 키는 `spacing[2]` (migrate가 쓰는 `jsTokenExpression`과 같은 모양) */
export function rnTokenExpression(token: DraftToken): string {
  const key = jsKeyOf(token.key);
  return /^(?:0|[1-9]\d*)$/.test(key) ? `${RN_EXPORT[token.group]}[${key}]` : `${RN_EXPORT[token.group]}.${key}`;
}

/** `export const tokens = { … } as const;` — 그룹 순서 color → space → radius → text, 빈 그룹 생략 */
export function emitTokensTs(draft: TokenDraft): string {
  const blocks: string[] = [];
  for (const group of GROUPS) {
    const entries = draft.tokens.filter((t) => t.group === group);
    if (entries.length === 0) continue;
    const lines = entries.map((t) => `    ${JSON.stringify(t.key)}: ${JSON.stringify(t.value)},`);
    blocks.push(`  ${group}: {\n${lines.join("\n")}\n  },`);
  }
  return (
    `// ${GENERATED_NOTICE}\nexport const tokens = {\n${blocks.join("\n")}\n} as const;\n\n` +
    `export type Tokens = typeof tokens;\n`
  );
}

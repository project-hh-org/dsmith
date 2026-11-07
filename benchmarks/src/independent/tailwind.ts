/**
 * Tailwind 클래스 판별 — 정규식 고정 목록. 독립 채점기의 (c) "Tailwind 팔레트·스케일 유틸리티"와 테마 키 해석.
 * dsmith의 tailwind 추출기·프리셋 해석을 쓰지 않는다.
 */

const PALETTE_NAMES = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const SPACING_PREFIX =
  "p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left|start|end|w|h|size|min-w|min-h|max-w|max-h|basis|indent";

export interface PalettePattern {
  /** 문서·테스트용 이름 */
  name: string;
  /** 변형(`hover:`)·`!`·앞의 `-`·뒤의 `/불투명도`를 뗀 유틸리티 하나에 대한 정규식 */
  re: RegExp;
  /** 문서용 예 */
  example: string;
}

/**
 * Tailwind 기본 테마(팔레트·스케일)를 그대로 쓰는 유틸리티. 임의 값(`p-[13px]`)과 테마 확장 키(`gap-ds-4`)는 여기에 없다.
 * 이 목록이 이 채점기가 "토큰이 아닌 값"으로 보는 Tailwind 클래스의 전부다.
 */
export const PALETTE_PATTERNS: readonly PalettePattern[] = [
  {
    name: "색 팔레트",
    re: new RegExp(
      `^(?:bg|text|border|border-[xytrblse]|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow)-(?:(?:${PALETTE_NAMES})-(?:50|100|200|300|400|500|600|700|800|900|950)|white|black)$`,
    ),
    example: "bg-blue-500, text-gray-700, border-white",
  },
  { name: "간격 스케일", re: new RegExp(`^(?:${SPACING_PREFIX})-(?:\\d+(?:\\.5)?|px)$`), example: "p-4, mt-0.5, gap-2, w-64, h-px" },
  { name: "최대 너비 이름", re: /^max-w-(?:xs|sm|md|lg|xl|[2-7]xl|prose)$/, example: "max-w-md" },
  { name: "글자 크기", re: /^text-(?:xs|sm|base|lg|xl|[2-9]xl)$/, example: "text-sm, text-2xl" },
  { name: "글자 굵기", re: /^font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/, example: "font-bold" },
  { name: "줄 높이", re: /^leading-(?:none|tight|snug|normal|relaxed|loose|\d+)$/, example: "leading-6, leading-tight" },
  { name: "자간", re: /^tracking-(?:tighter|tight|normal|wide|wider|widest)$/, example: "tracking-wide" },
  { name: "둥근 모서리", re: /^rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|ee|es))?(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?$/, example: "rounded, rounded-md, rounded-t-lg" },
  { name: "그림자", re: /^shadow(?:-(?:sm|md|lg|xl|2xl|inner|none))?$/, example: "shadow, shadow-md" },
  { name: "테두리·링 두께", re: /^(?:border|ring|outline|divide)(?:-[xytrblse])?-(?:0|2|4|8)$/, example: "border-2, ring-4, border-t-0" },
  { name: "불투명도", re: /^opacity-\d+$/, example: "opacity-50" },
];

/** 변형 접두사(`sm:`, `hover:`, `[&>p]:`)와 유틸리티로 나눈다. 최상위 `:`만 자르고 `[]`·`()` 안의 `:`는 그대로 둔다 */
export function splitVariants(token: string): { variants: string[]; utility: string } {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i += 1) {
    const ch = token[i];
    if (ch === "[" || ch === "(") depth += 1;
    else if (ch === "]" || ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === ":" && depth === 0) {
      parts.push(token.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(token.slice(start));
  const utility = parts.pop() ?? "";
  return { variants: parts, utility };
}

/** 유틸리티에서 `!`(앞·뒤)·앞의 `-`(음수)·뒤의 `/불투명도`를 뗀다. 대괄호 안의 `/`는 건드리지 않는다 */
export function normalizeUtility(utility: string): string {
  let u = utility.replace(/^!/, "").replace(/!$/, "").replace(/^-/, "");
  if (!u.includes("[")) u = u.replace(/\/(?:\d+(?:\.\d+)?|\[[^\]]*\])$/, "");
  return u;
}

/** 공백으로 나눈 비어 있지 않은 토큰 */
export function classTokens(text: string): string[] {
  return text.split(/\s+/).filter((t) => t !== "");
}

/** 이 유틸리티가 Tailwind 기본 팔레트·스케일이면 패턴 이름, 아니면 null */
export function paletteKind(normalized: string): string | null {
  for (const p of PALETTE_PATTERNS) if (p.re.test(normalized)) return p.name;
  return null;
}

export interface ArbitraryValue {
  /** `[` 앞 접두사(예: `bg-`, `text-`) */
  prefix: string;
  /** 첫 `[`와 마지막 `]` 사이 */
  inner: string;
}

/** `p-[13px]`, `text-[color:var(--x)]` 같은 임의 값. 아니면 null */
export function arbitraryValue(normalized: string): ArbitraryValue | null {
  const open = normalized.indexOf("[");
  const close = normalized.lastIndexOf("]");
  if (open === -1 || close < open) return null;
  return { prefix: normalized.slice(0, open), inner: normalized.slice(open + 1, close) };
}

/** 임의 값 접두사가 색을 받는 유틸리티인가(이 경우 이름 색(`red`)도 색 리터럴로 센다) */
export function isColorPrefix(prefix: string): boolean {
  return /^(?:bg|text|border|border-[xytrblse]|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|accent|caret|decoration|divide|placeholder)-$/.test(prefix);
}

/**
 * 테마 확장 키 클래스: 프리셋·설정 파일에서 `"키": "var(--이름)"`으로 선언된 키로 끝나는 유틸리티(`gap-ds-4` ← `ds-4`)면 그 var 이름.
 * 가장 긴 키를 우선한다. 앞쪽 유틸리티 접두사는 소문자·`-` 단어여야 한다.
 */
export function themeVarOf(normalized: string, themeVars: ReadonlyMap<string, string>): string | null {
  let best: { key: string; name: string } | null = null;
  for (const [key, name] of themeVars) {
    if (!normalized.endsWith(`-${key}`)) continue;
    const prefix = normalized.slice(0, normalized.length - key.length - 1);
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(prefix)) continue;
    if (best === null || key.length > best.key.length) best = { key, name };
  }
  return best === null ? null : best.name;
}

/**
 * 설정·프리셋 소스 텍스트에서 `키: "var(--이름...)"` 쌍을 읽는다(정규식 — 코드를 실행하거나 import하지 않는다).
 * 값이 var()가 아닌 키(`brand: "#3B82F6"`)는 무시한다.
 */
export function readThemeVarKeys(source: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of source.matchAll(/["']?([A-Za-z0-9_.-]+)["']?\s*:\s*["'`]\s*var\(\s*(--[A-Za-z0-9_-]+)/g)) {
    const key = m[1];
    const name = m[2];
    if (key !== undefined && name !== undefined) out.set(key, name);
  }
  return out;
}

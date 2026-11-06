/**
 * 독립 채점기의 값 스캐너 — 색 리터럴·길이 리터럴·var() 참조를 문자열에서 센다.
 * dsmith의 어떤 코드도 쓰지 않는다(정규식·고정 목록만).
 */

/** CSS Color Module Level 4 이름 색 147개(transparent·currentColor·inherit 등 키워드는 색 리터럴이 아니라서 뺌) */
export const NAMED_COLORS: readonly string[] = [
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue",
  "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson",
  "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen",
  "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise", "darkviolet",
  "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro",
  "ghostwhite", "gold", "goldenrod", "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred",
  "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
  "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey",
  "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid",
  "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
  "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen",
  "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "rebeccapurple",
  "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver",
  "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle",
  "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen",
];

const NAMED_SET: ReadonlySet<string> = new Set(NAMED_COLORS);

/** `#` 뒤 16진 8·6·4·3자리, 앞이 단어 문자·`&`(HTML 엔티티)·`/`이거나 뒤에 단어 문자·`-`가 이어지면 아님 */
const HEX = /(?<![\w&/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g;
/** rgb( rgba( hsl( hsla( oklch( — 함수 이름 앞이 식별자 문자가 아님 */
const COLOR_FN = /(?<![\w-])(?:rgba?|hsla?|oklch)\(/gi;

/** `url(...)` 안은 색이 아니다(`url(#grad)`) */
function stripUrls(text: string): string {
  return text.replace(/url\([^)]*\)/gi, "url()");
}

export interface ScanOptions {
  /** 이름 색(red, tan …)도 센다. 값이 색 속성일 때만 켠다 */
  named: boolean;
}

/** 문자열 안의 색 리터럴을 등장 순서대로(정규화: 소문자). hex → 함수 → 이름 순이 아니라 위치 순 */
export function scanColors(text: string, opts: ScanOptions): string[] {
  const src = stripUrls(text);
  const found: { at: number; value: string }[] = [];
  for (const m of src.matchAll(HEX)) found.push({ at: m.index ?? 0, value: m[0].toLowerCase() });
  for (const m of src.matchAll(COLOR_FN)) {
    const at = m.index ?? 0;
    const close = src.indexOf(")", at);
    const raw = close === -1 ? src.slice(at) : src.slice(at, close + 1);
    found.push({ at, value: raw.replace(/\s+/g, " ").toLowerCase() });
  }
  if (opts.named) {
    for (const m of src.matchAll(/[A-Za-z]+/g)) {
      const at = m.index ?? 0;
      const before = at === 0 ? "" : (src[at - 1] ?? "");
      const after = src[at + m[0].length] ?? "";
      // var(--color-red) 처럼 `-`나 `_`, 숫자·`(`에 붙은 단어는 이름 색이 아님
      if (/[-\w#.]/.test(before) || /[-\w(]/.test(after)) continue;
      const lower = m[0].toLowerCase();
      if (NAMED_SET.has(lower)) found.push({ at, value: lower });
    }
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.value);
}

/** 0이 아닌 `<숫자>px|rem` 길이. 값 그대로(소문자). `0px`·`0rem`은 세지 않는다 */
const LENGTH = /(?<![\w.#-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem)(?![\w%])/gi;

export function scanLengths(text: string): string[] {
  const src = stripUrls(text);
  const out: string[] = [];
  for (const m of src.matchAll(LENGTH)) {
    const value = m[0].toLowerCase();
    if (Number.parseFloat(value) === 0) continue;
    out.push(value);
  }
  return out;
}

const VAR_REF = /var\(\s*(--[A-Za-z0-9_-]+)/g;

/** `var(--name` 의 name들(등장 순서) */
export function scanVarRefs(text: string): string[] {
  return [...text.matchAll(VAR_REF)].map((m) => m[1] ?? "");
}

/** 이름 색을 볼 속성인가: 색이 들어갈 만한 CSS 속성 이름(kebab·camel 모두) */
export function isColorProperty(prop: string): boolean {
  return /color|background|border|outline|fill|stroke|shadow|caret|accent|decoration|gradient/i.test(prop);
}

/** 숫자(단위 없음)가 px로 해석되는 길이 속성(React 인라인 스타일) — camelCase */
const NUMERIC_LENGTH_PROPS =
  /^(?:padding|margin|inset|border(?:Top|Right|Bottom|Left)?(?:Width|Radius)|borderRadius|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius|gap|rowGap|columnGap|width|height|minWidth|maxWidth|minHeight|maxHeight|top|right|bottom|left|fontSize|letterSpacing|flexBasis|outlineWidth|outlineOffset|textIndent)(?:Top|Right|Bottom|Left|Inline|Block|X|Y|Start|End)?$/;

export function isNumericLengthProperty(prop: string): boolean {
  return NUMERIC_LENGTH_PROPS.test(prop);
}

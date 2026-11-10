import { converter, formatHex, parse } from "culori";
import type { NormalizedColor } from "../model/style-usage.js";

const toOklch = converter("oklch");

const NON_COLOR_KEYWORDS = new Set(["transparent", "currentcolor", "inherit", "initial", "unset"]);

/**
 * 값에 alpha < 1이 들어 있는가(`rgba(…, .5)`·`/ 50%`·4·8자리 hex). 해석할 수 없는 값은 false.
 * 원문(raw)만 있을 때 쓴다. 정규화된 값은 `normalizeColor(...).alpha`로 판단한다.
 */
export function isTranslucentColor(raw: string): boolean {
  const parsed = parse(raw.trim());
  return parsed?.alpha !== undefined && parsed.alpha < 1;
}

export function normalizeColor(raw: string): NormalizedColor | null {
  const input = raw.trim();
  if (NON_COLOR_KEYWORDS.has(input.toLowerCase())) return null;

  const parsed = parse(input);
  if (parsed === undefined) return null;

  const oklch = toOklch(parsed);
  const color: NormalizedColor = {
    kind: "color",
    hex: formatHex(parsed),
    l: oklch.l,
    c: oklch.c,
    h: oklch.h ?? 0,
  };
  // 불투명 색은 alpha를 생략한다 — 예전 index.json(alpha 없음)과 같은 모양을 유지한다
  if (parsed.alpha !== undefined && parsed.alpha < 1) color.alpha = parsed.alpha;
  return color;
}

/** `50%`(0.5)와 8자리 hex `80`(128/255 ≈ 0.502)은 같게, hex 한 단계(1/255 ≈ 0.0039)는 다르게 본다. */
const ALPHA_EPSILON = 0.003;

/** 두 색의 불투명도가 같은가(생략된 alpha는 1). 다르면 거리와 관계없이 서로 대체할 수 없다. */
export function sameAlpha(a: NormalizedColor, b: NormalizedColor): boolean {
  return Math.abs((a.alpha ?? 1) - (b.alpha ?? 1)) < ALPHA_EPSILON;
}

import type { StyleProperty } from "@dsmith-dev/extractor-api";

/** 색 값이지만 기본 분류가 `color`로 보지 않는 RN 키. */
const COLOR_KEYS: ReadonlySet<string> = new Set(["shadowColor", "textShadowColor", "tintColor", "overlayColor"]);

/** 값이 길이·색이 아니어서 점수 대상이 아닌 RN 키(기본 분류와 같은 결과를 명시한다). */
const OTHER_KEYS: ReadonlySet<string> = new Set([
  "elevation",
  "shadowOpacity",
  "shadowRadius",
  "borderWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStartWidth",
  "borderEndWidth",
  "lineHeight",
  "letterSpacing",
]);

/**
 * RN 키 분류 override. 기본 분류(`cssPropertyToStyleProperty`)가 이미 맞는 키(`paddingHorizontal`·`marginStart`·`borderTopLeftRadius` …)는 undefined.
 */
export function classifyRnKey(key: string): StyleProperty | undefined {
  if (COLOR_KEYS.has(key)) return "color";
  if (OTHER_KEYS.has(key)) return "other";
  return undefined;
}

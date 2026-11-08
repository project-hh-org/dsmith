import { cssVarRef, jsTokenExpression } from "@dsmith-dev/extractor-api";
import type { StyleUsage, TokenLike, TokenRefContext, WriteOptions, WritePatch } from "@dsmith-dev/extractor-api";
import { isRatedUsage } from "@dsmith-dev/core";

/** 치환 패치에 필요한 소스 구간. `quote`면 숫자 리터럴 노드 자리라 `tokenRef`를 문자열 리터럴로 감싼다. */
interface PatchTarget {
  start: number;
  end: number;
  file: string;
  quote: boolean;
  /** 문자열 리터럴 값 전체가 치환 구간일 때 따옴표를 포함한 노드 구간(식 치환용) */
  literal?: { start: number; end: number };
}

const patchTargets = new WeakMap<StyleUsage, PatchTarget>();

/** extract가 리터럴 값 usage를 만들 때 호출해 치환 구간을 기록한다. */
export function registerPatchTarget(usage: StyleUsage, target: PatchTarget): void {
  patchTargets.set(usage, target);
}

/**
 * 기록해 둔 구간을 치환하는 패치를 만든다. 문자열 값은 따옴표 안 구간에 `tokenRef` 그대로,
 * 숫자 값은 노드 전체를 `"<tokenRef>"` 문자열로 바꾼다.
 * `opts.expression`(tokenRef가 JS 식)이면 따옴표로 감싸지 않고 값 노드 전체를 바꾼다: 숫자 노드는 그대로, 문자열은 값 전체가 한 값일 때만
 * (`"1px solid #000"`의 일부는 null).
 * hardcoded가 아니거나 점수 대상이 아니거나(`isRatedUsage` false: other 속성·정규화 안 된 값) 이 추출기가 만들지 않은 usage는 null.
 */
export function write(usage: StyleUsage, tokenRef: string, opts?: WriteOptions): WritePatch | null {
  if (usage.source !== "hardcoded" || !isRatedUsage(usage)) return null;
  const target = patchTargets.get(usage);
  if (target === undefined) return null;
  if (opts?.expression === true) {
    const node = target.quote ? target : target.literal;
    if (node === undefined) return null;
    return { file: target.file, start: node.start, end: node.end, replacement: tokenRef };
  }
  return {
    file: target.file,
    start: target.start,
    end: target.end,
    replacement: target.quote ? JSON.stringify(tokenRef) : tokenRef,
  };
}

/**
 * JS 테마 토큰이면 JS 식(`colors.surface` — `write`에 `{ expression: true }`로 넘긴다), 아니면 CSS 변수 참조(`var(--x)`, 숫자 노드는 write가 문자열로 감싼다).
 * 변수가 아닌 이름의 토큰은 참조 형식이 없다.
 */
export function tokenRef(token: TokenLike, _usage?: StyleUsage, ctx?: TokenRefContext): string | null {
  if (token.js !== undefined) return jsTokenExpression(token, ctx?.jsLocal?.[token.js.export]);
  return cssVarRef(token);
}

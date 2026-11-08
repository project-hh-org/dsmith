import {
  cssPropertyToStyleProperty,
  normalizeColor,
  normalizeLength,
  rankTokens,
  replacementCandidates,
  tokenCategoryOf,
  type LoadedToken,
  type Token,
  type TokenSourceKind,
} from "@dsmith-dev/core";
import { cssVarRef, jsTokenExpression, type StyleProperty, type StyleUsage } from "@dsmith-dev/extractor-api";
import { tokenSourceKind, type Workspace } from "../workspace.js";

export interface ResolveTokenInput {
  raw: string;
  property?: string | undefined;
}

/** 값 자리에 쓰는 표현: CSS 변수 참조 또는 JS 테마 식(필요한 import 포함) */
export type TokenRef =
  | { kind: "css"; expression: string }
  | { kind: "js"; expression: string; import: { module: string; name: string } };

export interface ResolveTokenOutput {
  input: { raw: string; property?: string };
  token?: { name: string; value: string; ref?: TokenRef };
  /** 색은 oklch ΔE_ok, 길이는 px 차이. 소수 4자리, 토큰이 없으면 null */
  distance: number | null;
  /** 색: ΔE_ok < 0.005 high · < 0.03 medium · 그 이상 low. 길이: 0px high · ≤2px medium · 그 이상 low */
  confidence: "high" | "medium" | "low";
  source: TokenSourceKind;
  alternatives: { name: string; value: string; distance: number; source: TokenSourceKind }[];
  /** 값 종류와 property가 맞지 않아 후보가 없을 때의 안내 */
  hint?: string;
  /** 3a가 읽지 않는 형식이라 건너뛴 토큰 파일 */
  ignoredTokenFiles?: string[];
}

const ALTERNATIVES = 3;
const CONFIDENCE = { exact: "high", close: "medium", far: "low" } as const;
const ERROR_RAW_CHARS = 80;
const VAR_REF = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,.*)?\)$/s;

/** 응답용 토큰: 이름·값 + 참조 표현(`ref`). 참조 형식이 없는 토큰(CSS 변수가 아닌 카탈로그 토큰 등)은 ref 없음 */
function tokenOut(token: Token): NonNullable<ResolveTokenOutput["token"]> {
  const out = { name: token.name, value: token.value };
  const js = jsTokenExpression(token);
  if (token.js !== undefined && js !== null) return { ...out, ref: { kind: "js", expression: js, import: { module: token.js.module, name: token.js.export } } };
  const css = cssVarRef(token);
  return css === null ? out : { ...out, ref: { kind: "css", expression: css } };
}

/**
 * 제안·순위에 쓰는 토큰. 토큰 파일/카탈로그 토큰은 core `replacementCandidates`(프레임워크 규칙: 웹이 CSS·DTCG 토큰을 가지면 JS 테마 토큰 제외,
 * 모드 토큰 제외)를 거치고, audit 제안(proposal) 토큰은 그대로 뒤에 붙는다.
 */
export function candidateTokens(ws: Workspace): LoadedToken[] {
  const own = ws.tokens.tokens.filter((t) => t.source !== "proposal");
  const proposals = ws.tokens.tokens.filter((t) => t.source === "proposal");
  return [...replacementCandidates(own, { framework: ws.detect.framework.name }), ...proposals];
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function inputEcho(raw: string, property: string | undefined): ResolveTokenOutput["input"] {
  return property === undefined ? { raw } : { raw, property };
}

function mismatchHint(kind: "color" | "length", property: string, category: string): string {
  return kind === "color"
    ? `색 값은 ${category} 토큰과 비교할 수 없음(property: ${property}). property를 빼거나 색 속성(color, background-color …)을 지정`
    : `길이 값은 색 토큰과 비교할 수 없음(property: ${property}). property를 빼거나 길이 속성(padding, border-radius …)을 지정`;
}

/**
 * 이미 정규화한 값에 가장 가까운 토큰. property(kebab/camel)가 있으면 그 속성의 카테고리 토큰만 후보다.
 * lint_snippet은 Extractor가 정규화한 값을 그대로 넘긴다 — Tailwind의 `raw`는 `text-[#3B82F6]`처럼 클래스 전체라 다시 해석할 수 없다.
 */
export function resolveNormalized(
  ws: Workspace,
  normalized: StyleUsage["normalized"],
  input: ResolveTokenInput,
): ResolveTokenOutput {
  const property: StyleProperty | undefined = input.property === undefined ? undefined : cssPropertyToStyleProperty(input.property);
  const category = property === undefined ? null : tokenCategoryOf(property);
  const ranked = rankTokens(normalized, candidateTokens(ws), {
    ...(category === null ? {} : { category }),
    limit: ALTERNATIVES + 1,
  });

  const sourceOf = (name: string): TokenSourceKind => ws.tokenSources.get(name) ?? "token-file";
  const [best, ...rest] = ranked;
  const out: ResolveTokenOutput = {
    input: inputEcho(input.raw, input.property),
    ...(best === undefined ? {} : { token: tokenOut(best.token) }),
    distance: best === undefined ? null : round4(best.distance),
    confidence: best === undefined ? "low" : CONFIDENCE[best.confidence],
    source: best === undefined ? tokenSourceKind(ws.tokens) : sourceOf(best.token.name),
    alternatives: rest.map((r) => ({ name: r.token.name, value: r.token.value, distance: round4(r.distance), source: sourceOf(r.token.name) })),
  };
  if (best === undefined && input.property !== undefined && category !== null && normalized.kind !== "unknown") {
    if (normalized.kind === "color" && category !== "color") out.hint = mismatchHint("color", input.property, category);
    if (normalized.kind === "length" && category === "color") out.hint = mismatchHint("length", input.property, category);
  }
  if (ws.tokens.ignored.length > 0) out.ignoredTokenFiles = ws.tokens.ignored;
  return out;
}

/** raw 값(색·길이·`var(--known-token)`)에 가장 가까운 토큰. 해석할 수 없는 값이면 throw. */
export function resolveToken(ws: Workspace, input: ResolveTokenInput): ResolveTokenOutput {
  const raw = input.raw.trim();
  const ref = VAR_REF.exec(raw)?.[1];
  if (ref !== undefined) {
    const known = ws.tokens.tokens.find((t) => t.name === ref);
    if (known !== undefined) {
      return {
        input: inputEcho(raw, input.property),
        token: tokenOut(known),
        distance: 0,
        confidence: "high",
        source: ws.tokenSources.get(known.name) ?? "token-file",
        alternatives: [],
        ...(ws.tokens.ignored.length > 0 ? { ignoredTokenFiles: ws.tokens.ignored } : {}),
      };
    }
  }
  // 알려진 JS 테마 토큰 이름(`colors.surface`)
  const knownJs = ws.tokens.tokens.find((t) => t.js !== undefined && t.name === raw);
  if (knownJs !== undefined) {
    return {
      input: inputEcho(raw, input.property),
      token: tokenOut(knownJs),
      distance: 0,
      confidence: "high",
      source: ws.tokenSources.get(knownJs.name) ?? "token-file",
      alternatives: [],
      ...(ws.tokens.ignored.length > 0 ? { ignoredTokenFiles: ws.tokens.ignored } : {}),
    };
  }
  const color = normalizeColor(raw);
  const px = color === null ? normalizeLength(raw) : null;
  if (color === null && px === null) throw new Error(`값을 해석할 수 없음: ${clip(raw, ERROR_RAW_CHARS)}`);
  return resolveNormalized(ws, color ?? { kind: "length", px: px ?? 0 }, { raw, property: input.property });
}

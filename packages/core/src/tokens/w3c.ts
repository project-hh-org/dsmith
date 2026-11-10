/**
 * W3C Design Tokens Format Module 2025.10 직렬화·읽기.
 * 근거(부록 B.1·B.2, 2026-11-01 확인):
 *  - https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
 *  - https://w3c.github.io/cg-reports/design-tokens/CG-FINAL-color-20251028/
 * color `$value`는 객체 { colorSpace, components, hex(6자리) }, dimension은 { value, unit }.
 * fontSize·borderRadius 타입은 없으므로 모두 dimension으로 쓴다. 확장 키는 역도메인 "dev.dsmith".
 * 읽기는 2025 이전 초안의 문자열 값("#3b82f6", "8px")도 받는다.
 */
import { converter, formatHex8, parse, parseHex } from "culori";
import type { Token } from "../model/token.js";
import { normalizeColor } from "../normalize/color.js";
import { normalizeLength } from "../normalize/length.js";
import type { DraftGroup, TokenDraft } from "./draft.js";
import { GENERATED_NOTICE } from "./emit.js";
import { DS_CSS_PREFIX } from "./naming.js";

export const DSMITH_EXTENSION = "dev.dsmith";

export interface W3cColorValue {
  colorSpace: "srgb";
  components: [number, number, number];
  hex: string;
}
export interface W3cDimensionValue {
  value: number;
  unit: "px";
}
export interface DsmithExtension {
  category: Token["category"];
  usageCount: number;
  members: string[];
  chosen?: string;
}

const GROUPS: readonly DraftGroup[] = ["color", "space", "radius", "text"];
const toRgb = converter("rgb");

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function colorValue(hex: string): W3cColorValue {
  const rgb = toRgb(hex);
  const c = (n: number | undefined): number => round4(Math.min(1, Math.max(0, n ?? 0)));
  return {
    colorSpace: "srgb",
    components: [c(rgb?.r), c(rgb?.g), c(rgb?.b)],
    hex: hex.toLowerCase(),
  };
}

export function draftToW3c(draft: TokenDraft): Record<string, unknown> {
  const out: Record<string, unknown> = { $description: GENERATED_NOTICE };
  if (draft.naming === "ds") out.$extensions = { [DSMITH_EXTENSION]: { cssPrefix: DS_CSS_PREFIX } };
  for (const group of GROUPS) {
    const entries = draft.tokens.filter((t) => t.group === group);
    if (entries.length === 0) continue;
    const node: Record<string, unknown> = {};
    for (const t of entries) {
      const extension: DsmithExtension = {
        category: t.category,
        usageCount: t.usageCount,
        members: t.members,
        ...(t.chosen === undefined ? {} : { chosen: t.chosen }),
      };
      const isColor = t.normalized.kind === "color";
      node[t.key] = {
        $type: isColor ? "color" : "dimension",
        $value: isColor
          ? colorValue(t.value)
          : ({ value: t.normalized.kind === "length" ? t.normalized.px : 0, unit: "px" } satisfies W3cDimensionValue),
        $extensions: { [DSMITH_EXTENSION]: extension },
      };
    }
    out[group] = node;
  }
  return out;
}

export function serializeW3c(draft: TokenDraft): string {
  return `${JSON.stringify(draftToW3c(draft), null, 2)}\n`;
}

export interface W3cReadResult {
  tokens: Token[];
  warnings: string[];
}

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

const MAX_ALIAS_DEPTH = 5;
const CSS_PREFIX = /^[a-z][a-z0-9]*$/;
const ALIAS = /^\{([^{}]+)\}$/;
const RADIUS_GROUPS = new Set(["radius", "radii", "rounded", "border-radius"]);
const FONT_SIZE_GROUPS = new Set(["text", "font-size", "fontsize", "font-sizes", "fontsizes"]);
const FUNCTION_SPACES = new Set(["hsl", "hwb", "lab", "lch", "oklab", "oklch"]);

interface Entry {
  path: string[];
  node: Json;
  type: string | undefined;
}

function walk(node: Json, path: string[], inherited: string | undefined, out: Entry[]): void {
  const type = typeof node.$type === "string" ? node.$type : inherited;
  if ("$value" in node) {
    out.push({ path, node, type });
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$") || !isObject(child)) continue;
    walk(child, [...path, key], type, out);
  }
}

/** 색 객체의 `alpha`(0~1, 생략이면 1). 1 미만이면 정규화 결과에 싣는다 — `hex`는 명세상 불투명 6자리라 alpha를 담지 못한다. */
function withObjectAlpha(color: ReturnType<typeof normalizeColor>, value: Json): ReturnType<typeof normalizeColor> {
  if (color === null || typeof value.alpha !== "number" || value.alpha >= 1) return color;
  return { ...color, alpha: Math.max(0, value.alpha) };
}

function colorFromObject(value: Json): ReturnType<typeof normalizeColor> {
  if (typeof value.hex === "string") {
    const fromHex = normalizeColor(value.hex);
    if (fromHex !== null) return withObjectAlpha(fromHex, value);
  }
  const space = value.colorSpace;
  const comps = value.components;
  if (typeof space !== "string" || !Array.isArray(comps) || comps.length < 3) return null;
  const nums = comps.slice(0, 3).map((c) => (typeof c === "number" ? c : 0));
  const css = FUNCTION_SPACES.has(space)
    ? `${space}(${nums.join(" ")})`
    : `color(${space} ${nums.join(" ")})`;
  return parse(css) === undefined ? null : withObjectAlpha(normalizeColor(css), value);
}

function categoryOf(entry: Entry, kind: "color" | "length"): Token["category"] {
  const ext = isObject(entry.node.$extensions) ? entry.node.$extensions[DSMITH_EXTENSION] : undefined;
  const declared = isObject(ext) ? ext.category : undefined;
  if (declared === "color" || declared === "spacing" || declared === "radius" || declared === "font-size") {
    return declared;
  }
  if (kind === "color") return "color";
  const head = (entry.path[0] ?? "").toLowerCase();
  if (RADIUS_GROUPS.has(head)) return "radius";
  if (FONT_SIZE_GROUPS.has(head)) return "font-size";
  return "spacing";
}

export function readW3cTokens(text: string, file: string): W3cReadResult {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    return { tokens: [], warnings: [`토큰 JSON을 읽을 수 없음: ${file}`] };
  }
  if (!isObject(root)) return { tokens: [], warnings: [`토큰 JSON을 읽을 수 없음: ${file}`] };

  const entries: Entry[] = [];
  walk(root, [], undefined, entries);
  const byPath = new Map(entries.map((e) => [e.path.join("."), e]));
  const warnings: string[] = [];
  const tokens: Token[] = [];

  // 루트 확장 $extensions["dev.dsmith"].cssPrefix: CSS 변수 이름 접두. 토큰 경로(path)는 그대로
  let prefix = "";
  const rootExt = isObject(root.$extensions) ? root.$extensions[DSMITH_EXTENSION] : undefined;
  const declaredPrefix = isObject(rootExt) ? rootExt.cssPrefix : undefined;
  if (typeof declaredPrefix === "string") {
    if (CSS_PREFIX.test(declaredPrefix)) prefix = `${declaredPrefix}-`;
    else warnings.push(`토큰 CSS 접두를 읽을 수 없음: ${declaredPrefix} (${file})`);
  }

  for (const entry of entries) {
    const label = entry.path.join(".");
    let value: unknown = entry.node.$value;
    let type = entry.type;
    let failed = false;
    const visited = new Set<string>([label]);
    for (let depth = 0; typeof value === "string" && ALIAS.test(value); depth++) {
      const target = ALIAS.exec(value)![1]!;
      const next = byPath.get(target);
      if (next === undefined || visited.has(target) || depth >= MAX_ALIAS_DEPTH) {
        warnings.push(`토큰 별칭을 해석할 수 없음: ${label} → ${value} (${file})`);
        failed = true;
        break;
      }
      visited.add(target);
      value = next.node.$value;
      type ??= next.type;
    }
    if (failed) continue;
    if (isObject(value) && "$ref" in value) {
      warnings.push(`$ref는 지원하지 않음: ${label} (${file})`);
      continue;
    }
    if (type !== "color" && type !== "dimension") continue;

    const name = `--${prefix}${entry.path.join("-")}`;
    if (type === "color") {
      const normalized =
        typeof value === "string" ? normalizeColor(value) : isObject(value) ? colorFromObject(value) : null;
      if (normalized === null) {
        warnings.push(`색 값을 읽을 수 없음: ${label} (${file})`);
        continue;
      }
      // 반투명 토큰의 value는 8자리 hex로 — 6자리면 리포트·MCP 답에서 불투명 색처럼 보인다
      const shown = normalized.alpha === undefined ? normalized.hex : formatHex8({ ...parseHex(normalized.hex), alpha: normalized.alpha });
      tokens.push({ name, value: shown, normalized, category: categoryOf(entry, "color"), path: label });
      continue;
    }
    let raw: string | null = null;
    if (typeof value === "string") raw = value;
    else if (isObject(value) && typeof value.value === "number" && (value.unit === "px" || value.unit === "rem")) {
      raw = `${value.value}${value.unit}`;
    }
    const px = raw === null ? null : normalizeLength(raw);
    if (raw === null || px === null) {
      warnings.push(`길이 값을 읽을 수 없음: ${label} (${file})`);
      continue;
    }
    tokens.push({ name, value: raw, normalized: { kind: "length", px }, category: categoryOf(entry, "length"), path: label });
  }
  return { tokens, warnings };
}

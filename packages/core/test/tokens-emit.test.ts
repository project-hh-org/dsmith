import { describe, expect, it } from "vitest";
import type { StyleProperty, StyleUsage } from "@dsmith-dev/extractor-api";
import { normalizeColor } from "../src/normalize/color.js";
import { parseCssDeclarations } from "../src/parse/css-text.js";
import { parseTsx } from "../src/parse/tsx.js";
import { buildTokenDraft } from "../src/tokens/draft.js";
import { emitTokensCss, emitTokensTs } from "../src/tokens/emit.js";
import { readCssVariableTokens } from "../src/tokens/css-variables.js";

function color(hex: string, property: StyleProperty = "color"): StyleUsage {
  return { file: "a.tsx", line: 1, column: 1, property, raw: hex, normalized: normalizeColor(hex)!, source: "hardcoded", extractor: "t" };
}
function len(px: number, property: StyleProperty): StyleUsage {
  return { file: "a.tsx", line: 1, column: 1, property, raw: `${px}px`, normalized: { kind: "length", px }, source: "hardcoded", extractor: "t" };
}
const draftInput = [
  color("#3b82f6"), color("#111111"), len(8, "padding"), len(6, "border-radius"), len(12, "font-size"), len(16, "font-size"),
];
const draft = buildTokenDraft(draftInput);

describe("emitTokensCss", () => {
  const css = emitTokensCss(draft);
  it("다시 읽으면 같은 수·카테고리 — ds 형식은 --ds-text-xs도 font-size", () => {
    const read = readCssVariableTokens(css, "tokens.css");
    expect(read).toHaveLength(draft.tokens.length);
    expect(read.map((t) => t.category)).toEqual(draft.tokens.map((t) => t.category));
    expect(read.map((t) => t.name)).toEqual(draft.tokens.map((t) => t.cssVar));
    expect(read.every((t) => t.name.startsWith("--ds-"))).toBe(true);
    expect(read.find((t) => t.name === "--ds-text-xs")?.category).toBe("font-size");
    expect(read.find((t) => t.name === "--ds-radius-md")?.category).toBe("radius");
    expect(read.find((t) => t.name === "--ds-space-2")?.category).toBe("spacing");
  });
  it("legacy 형식은 0.3.0과 같은 줄", () => {
    const legacy = emitTokensCss(buildTokenDraft(draftInput, { naming: "legacy" }));
    expect(legacy).toContain("  --space-2: 8px;\n");
    expect(legacy).toContain("  --text-xs: 12px;\n");
    expect(legacy).not.toContain("--ds-");
    const read = readCssVariableTokens(legacy, "tokens.css");
    expect(read.find((t) => t.name === "--text-xs")?.category).toBe("font-size");
    expect(read.find((t) => t.name === "--radius-md")?.category).toBe("radius");
  });
  it("--ds- 밖의 다른 접두는 font-size로 넓히지 않는다", () => {
    const read = readCssVariableTokens(":root { --foo-text-xs: 13px; --ds-text-xs: 13px; }", "t.css");
    expect(read.map((t) => [t.name, t.category])).toEqual([["--foo-text-xs", "spacing"], ["--ds-text-xs", "font-size"]]);
  });
  it("유효한 CSS 선언", () => {
    const decls = parseCssDeclarations(css, 0, {});
    expect(decls.length).toBe(draft.tokens.length);
    expect(decls.some((d) => d.dynamic)).toBe(false);
    expect(css).toMatch(/^\/\* .* \*\/\n:root \{\n/);
    expect(css.endsWith("}\n")).toBe(true);
  });
});

describe("emitTokensTs", () => {
  const ts = emitTokensTs(draft);
  it("as const와 Tokens 타입, 파싱 오류 없음", () => {
    expect(ts).toContain("} as const;");
    expect(ts).toContain("export type Tokens = typeof tokens;");
    expect(ts).toContain('"2": "8px"');
    const parsed = parseTsx(ts, "tokens.ts") as { errors?: unknown[] };
    expect(parsed.errors ?? []).toHaveLength(0);
  });
  it("스냅샷", () => {
    expect(ts).toMatchSnapshot();
  });
});

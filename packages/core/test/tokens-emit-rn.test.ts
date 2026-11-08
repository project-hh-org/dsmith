import { describe, expect, it } from "vitest";
import type { StyleProperty, StyleUsage } from "@dsmith-dev/extractor-api";
import { normalizeColor } from "../src/normalize/color.js";
import { buildTokenDraft } from "../src/tokens/draft.js";
import { GENERATED_NOTICE, emitTokensTsRn, rnTokenExpression } from "../src/tokens/emit.js";
import { readJsThemeTokens } from "../src/tokens/js-theme.js";

function color(hex: string, property: StyleProperty = "color"): StyleUsage {
  return { file: "a.tsx", line: 1, column: 1, property, raw: hex, normalized: normalizeColor(hex)!, source: "hardcoded", extractor: "t" };
}
function len(px: number, property: StyleProperty): StyleUsage {
  return { file: "a.tsx", line: 1, column: 1, property, raw: `${px}px`, normalized: { kind: "length", px }, source: "hardcoded", extractor: "t" };
}
const draft = buildTokenDraft([
  color("#3b82f6"), color("#111111"), len(8, "padding"), len(6, "border-radius"), len(12, "font-size"), len(16, "font-size"),
]);

describe("emitTokensTsRn", () => {
  const code = emitTokensTsRn(draft);

  it("그룹 color→colors, space→spacing, radius→radius, text→fontSize, 단위 없는 number, 키는 식별자", () => {
    expect(code).toBe(
      `// ${GENERATED_NOTICE}\n` +
        "export const colors = {\n" +
        '  gray900: "#111111",\n' +
        '  blue400: "#3b82f6",\n' +
        "} as const;\n\n" +
        "export const spacing = {\n" +
        "  2: 8,\n" +
        "} as const;\n\n" +
        "export const radius = {\n" +
        "  md: 6,\n" +
        "} as const;\n\n" +
        "export const fontSize = {\n" +
        "  xs: 12,\n" +
        "  base: 16,\n" +
        "} as const;\n",
    );
  });

  it("readJsThemeTokens로 다시 읽으면 (category, normalized)가 같다", () => {
    const read = readJsThemeTokens(code, "design-system/tokens.ts", { module: "design-system/tokens" });
    const key = (t: { category: string; normalized: unknown }): string => `${t.category}|${JSON.stringify(t.normalized)}`;
    expect(read.tokens.map(key).sort()).toEqual(draft.tokens.map(key).sort());
    expect(read.warnings).toEqual([]);
  });

  it("rnTokenExpression은 읽은 토큰의 참조 식과 같다", () => {
    expect(draft.tokens.map(rnTokenExpression)).toEqual([
      "colors.gray900",
      "colors.blue400",
      "spacing[2]",
      "radius.md",
      "fontSize.xs",
      "fontSize.base",
    ]);
  });

  it("빈 그룹은 생략하고, 토큰이 없으면 머리말만 남긴다", () => {
    expect(emitTokensTsRn({ ...draft, tokens: [] })).toBe(`// ${GENERATED_NOTICE}\n`);
  });

  it("식별자가 아닌 키는 정리한다(blue-400 → blue400, 2xl → _2xl)", () => {
    const base = draft.tokens[0]!;
    const tokens = [
      { ...base, group: "color" as const, key: "blue-400", name: "color-blue-400" },
      { ...base, group: "color" as const, key: "2xl", name: "color-2xl" },
    ];
    const out = emitTokensTsRn({ ...draft, tokens });
    expect(out).toContain("  blue400: ");
    expect(out).toContain("  _2xl: ");
    expect(tokens.map(rnTokenExpression)).toEqual(["colors.blue400", "colors._2xl"]);
  });
});

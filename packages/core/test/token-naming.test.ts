import { describe, expect, it } from "vitest";
import type { StyleProperty, StyleUsage } from "@dsmith-dev/extractor-api";
import { normalizeColor } from "../src/normalize/color.js";
import { buildTokenDraft, draftToTokens } from "../src/tokens/draft.js";
import { emitTokensCss } from "../src/tokens/emit.js";
import { readCssVariableTokens } from "../src/tokens/css-variables.js";
import { cssVarName, detectNamingFromFiles, semanticNameOf } from "../src/tokens/naming.js";
import { readW3cTokens, serializeW3c } from "../src/tokens/w3c.js";

describe("cssVarName", () => {
  it.each([
    ["color", "blue-400", "--ds-color-blue-400", "--color-blue-400"],
    ["space", "2", "--ds-space-2", "--space-2"],
    ["radius", "sm", "--ds-radius-sm", "--radius-sm"],
    ["radius", "full", "--ds-radius-full", "--radius-full"],
    ["text", "xs", "--ds-text-xs", "--text-xs"],
  ] as const)("%s %s", (group, key, ds, legacy) => {
    expect(cssVarName(group, key, "ds")).toBe(ds);
    expect(cssVarName(group, key, "legacy")).toBe(legacy);
  });
});

describe("semanticNameOf", () => {
  it("접두와 -- 를 벗긴다(왕복)", () => {
    for (const [group, key] of [["color", "gray-50"], ["space", "2"], ["radius", "full"], ["text", "2xl"]] as const) {
      for (const naming of ["ds", "legacy"] as const) {
        expect(semanticNameOf(cssVarName(group, key, naming))).toBe(`${group}-${key}`);
      }
    }
  });
});

describe("detectNamingFromFiles", () => {
  const dsJson = JSON.stringify({ $extensions: { "dev.dsmith": { cssPrefix: "ds" } }, color: {} });
  const legacyJson = JSON.stringify({ $description: "x", color: {} });
  it("json ds", () => expect(detectNamingFromFiles({ json: dsJson, css: ":root{--color-a:#fff}" })).toBe("ds"));
  it("json 확장 없음 → legacy (css가 달라도 json 우선)", () => {
    expect(detectNamingFromFiles({ json: legacyJson, css: ":root{--ds-color-a:#fff}" })).toBe("legacy");
  });
  it("json 깨짐 + css --ds- → ds", () => {
    expect(detectNamingFromFiles({ json: "{oops", css: "/* n */\n:root {\n  --ds-color-a: #fff;\n}\n" })).toBe("ds");
  });
  it("css만: 첫 선언이 접두 없음 → legacy", () => {
    expect(detectNamingFromFiles({ json: null, css: "/* --ds-x: 1 */\n:root {\n  --color-a: #fff;\n  --ds-b: 1;\n}\n" })).toBe("legacy");
  });
  it("둘 다 판정 불가 → null", () => {
    expect(detectNamingFromFiles({ json: null, css: null })).toBeNull();
    expect(detectNamingFromFiles({ json: "{oops", css: ":root {}" })).toBeNull();
  });
});

describe("왕복: tokens.css와 tokens.json이 같은 이름을 낸다", () => {
  const color = (hex: string): StyleUsage => ({
    file: "a.tsx", line: 1, column: 1, property: "color", raw: hex, normalized: normalizeColor(hex)!, source: "hardcoded", extractor: "t",
  });
  const len = (px: number, property: StyleProperty): StyleUsage => ({
    file: "a.tsx", line: 1, column: 1, property, raw: `${px}px`, normalized: { kind: "length", px }, source: "hardcoded", extractor: "t",
  });
  const styles = [
    color("#3b82f6"), color("#3b82f6"), color("#111111"), len(8, "padding"), len(8, "padding"), len(16, "gap"),
    len(6, "border-radius"), len(9999, "border-radius"), len(13, "font-size"), len(16, "font-size"),
  ];

  it.each(["ds", "legacy"] as const)("%s", (naming) => {
    const draft = buildTokenDraft(styles, { naming });
    const fromCss = readCssVariableTokens(emitTokensCss(draft), "tokens.css");
    const w3c = readW3cTokens(serializeW3c(draft), "tokens.json");
    expect(w3c.warnings).toEqual([]);
    const key = (t: { name: string; category: string; normalized: unknown }) => JSON.stringify([t.name, t.category, t.normalized]);
    expect(new Set(fromCss.map(key))).toEqual(new Set(w3c.tokens.map(key)));
    expect(fromCss.map((t) => t.name)).toEqual(draftToTokens(draft).map((t) => t.name));
    expect(w3c.tokens.every((t) => /^[a-z]+\.[\w-]+$/.test(t.path ?? ""))).toBe(true);
    expect(w3c.tokens.find((t) => t.path === "color.blue-400" || t.path?.startsWith("color."))).toBeDefined();
  });
});

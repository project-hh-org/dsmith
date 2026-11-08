import { describe, expect, it } from "vitest";
import { JS_THEME_CANDIDATES, jsKeyOf, readJsThemeTokens } from "../src/tokens/js-theme.js";

const read = (code: string, resolveImport?: (s: string) => { code: string; file: string } | null) =>
  readJsThemeTokens(code, "src/theme.ts", { module: "src/theme", ...(resolveImport === undefined ? {} : { resolveImport }) });

const names = (code: string) => read(code).tokens.map((t) => t.name);

describe("readJsThemeTokens", () => {
  it("export const X = {…} as const 의 색·간격·모서리·글꼴 크기 잎을 토큰으로 읽는다", () => {
    const { tokens, exports, warnings } = read(`
export const colors = { surface: "#ffffff", ink: "#111", nested: { accent: "#3b82f6" } } as const;
export const spacing = { 1: 4, sm: 8 } as const;
export const radius = { sm: 4 } satisfies Record<string, number>;
export const typography = { caption: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16 } };
`);
    expect(exports).toEqual(["colors", "spacing", "radius", "typography"]);
    expect(warnings).toEqual([]);
    expect(tokens.map((t) => [t.name, t.category, t.value])).toEqual([
      ["colors.surface", "color", "#ffffff"],
      ["colors.ink", "color", "#111"],
      ["colors.nested.accent", "color", "#3b82f6"],
      ["spacing.1", "spacing", "4"],
      ["spacing.sm", "spacing", "8"],
      ["radius.sm", "radius", "4"],
      ["typography.caption.fontSize", "font-size", "12"],
    ]);
    const surface = tokens[0]!;
    expect(surface.normalized).toMatchObject({ kind: "color", hex: "#ffffff" });
    expect(surface.js).toEqual({ module: "src/theme", export: "colors", path: ["surface"] });
    expect(tokens[3]!.normalized).toEqual({ kind: "length", px: 4 });
    expect(tokens[3]!.js).toEqual({ module: "src/theme", export: "spacing", path: ["1"] });
    expect(tokens[6]!.js?.path).toEqual(["caption", "fontSize"]);
  });

  it("const X = {…}; export { X } 와 export { X as Y }", () => {
    const { tokens } = read(`const palette = { a: "#fff" }; const sizes = { m: 16 }; export { palette, sizes as gaps };`);
    expect(tokens.map((t) => [t.name, t.category, t.js?.export])).toEqual([
      ["palette.a", "color", "palette"],
      ["gaps.m", "spacing", "gaps"],
    ]);
  });

  it("export default {…} 는 export 이름 default", () => {
    const { tokens, exports } = read(`export default { primary: "#3b82f6", radius: { md: 6 } };`);
    expect(exports).toEqual(["default"]);
    expect(tokens.map((t) => [t.name, t.category])).toEqual([
      ["default.primary", "color"],
      ["default.radius.md", "radius"],
    ]);
  });

  it("조상이 규칙에 맞지 않는 숫자는 토큰이 아니다(잎 키 자신은 조상이 아님)", () => {
    expect(names(`export const theme = { primary: "#fff", radius: 6, zIndex: 10 };`)).toEqual(["theme.primary"]);
  });

  it("가장 가까운 조상 규칙을 따르고 fontSizes 아래 숫자는 font-size", () => {
    const { tokens } = read(`export const theme = { spacing: { radius: { sm: 2 } }, fontSizes: { lg: 20 } };`);
    expect(tokens.map((t) => [t.name, t.category])).toEqual([
      ["theme.spacing.radius.sm", "radius"],
      ["theme.fontSizes.lg", "font-size"],
    ]);
  });

  it("음수와 숫자 키, 문자열 키", () => {
    const { tokens } = read(`export const spacing = { "2xl": 48, neg: -4, 500: 5 };`);
    expect(tokens.map((t) => [t.name, t.normalized])).toEqual([
      ["spacing.2xl", { kind: "length", px: 48 }],
      ["spacing.neg", { kind: "length", px: -4 }],
      ["spacing.500", { kind: "length", px: 5 }],
    ]);
  });

  it("light/dark 자식을 가진 객체 아래 토큰에는 mode가 붙는다", () => {
    const { tokens } = read(`export const Colors = { light: { background: "#fff", nested: { a: "#111" } }, dark: { background: "#000" } };`);
    expect(tokens.map((t) => [t.name, t.js?.mode])).toEqual([
      ["Colors.light.background", "light"],
      ["Colors.light.nested.a", "light"],
      ["Colors.dark.background", "dark"],
    ]);
    const plain = read(`export const Colors = { light: { a: "#fff" }, dark: { a: "#000" }, brand: "#3b82f6" };`).tokens;
    expect(plain.every((t) => !("mode" in t.js!))).toBe(true);
  });

  it("같은 파일 const 객체를 값으로 가리키면 따라간다", () => {
    expect(names(`const brand = { 500: "#3b82f6" }; export const colors = { brand };\nexport const alt = { brand: brand };`)).toEqual([
      "colors.brand.500",
      "alt.brand.500",
    ]);
  });

  it("상대 경로 named import 한 단계를 따라가고, 두 단계부터는 경고하고 건너뛴다", () => {
    const files: Record<string, string> = {
      "./status": `import { deeper } from "./deeper"; export const STATUS = { ok: "#22c55e", bad: "#ef4444" } as const; export const CHAIN = { x: deeper };`,
    };
    const resolveImport = (s: string) => (files[s] === undefined ? null : { code: files[s]!, file: "src/status.ts" });
    const out = read(
      `import { STATUS as S, CHAIN } from "./status";\nexport const colors = { primary: "#fff", status: S, chain: CHAIN };`,
      resolveImport,
    );
    expect(out.tokens.map((t) => t.name)).toEqual(["colors.primary", "colors.status.ok", "colors.status.bad"]);
    expect(out.warnings).toEqual(["JS 테마 값을 해석하지 못함: colors.chain.x (src/theme.ts)"]);
  });

  it("해석 못 하는 import와 함수 호출 값은 경고하고 건너뛴다", () => {
    const out = read(`import { OTHER } from "./nope";\nexport const colors = { a: "#fff", b: OTHER, c: shade("#000"), [dyn]: "#111" };`);
    expect(out.tokens.map((t) => t.name)).toEqual(["colors.a"]);
    expect(out.warnings).toEqual([
      "JS 테마 값을 해석하지 못함: colors.b (src/theme.ts)",
      "JS 테마 값을 해석하지 못함: colors.c (src/theme.ts)",
      "JS 테마 값을 해석하지 못함: colors.[계산 키] (src/theme.ts)",
    ]);
  });

  it("createTheme({…}) 호출 export와 웹 차트 설정 모양은 토큰 0", () => {
    expect(read(`export const theme = createTheme({ palette: { primary: "#fff" } });`).tokens).toEqual([]);
    const chart = read(`export const chartConfig = { series: [{ color: "#fff", size: 4 }], title: "Sales", height: 300 };`);
    expect(chart.tokens).toEqual([]);
    expect(chart.exports).toEqual([]);
  });

  it("토큰을 내지 못한 export의 경고는 싣지 않는다", () => {
    expect(read(`export const noise = { a: fn(), b: x };`).warnings).toEqual([]);
  });

  it("타입 전용 import는 따라가지 않는다", () => {
    const resolveImport = () => ({ code: `export const C = { a: "#fff" };`, file: "src/c.ts" });
    const out = read(`import type { C } from "./c";\nexport const colors = { x: C, y: "#000" };`, resolveImport);
    expect(out.tokens.map((t) => t.name)).toEqual(["colors.y"]);
  });

  it("문법 오류 파일은 빈 결과", () => {
    expect(read(`export const = {{{`).tokens).toEqual([]);
  });
});

describe("jsKeyOf", () => {
  it("식별자로 만든다", () => {
    expect(jsKeyOf("blue-400")).toBe("blue400");
    expect(jsKeyOf("gray-50")).toBe("gray50");
    expect(jsKeyOf("2")).toBe("2");
    expect(jsKeyOf("2xl")).toBe("_2xl");
    expect(jsKeyOf("text")).toBe("text");
  });
});

describe("JS_THEME_CANDIDATES", () => {
  it("glob 목록", () => {
    expect(JS_THEME_CANDIDATES.length).toBeGreaterThan(0);
    expect(JS_THEME_CANDIDATES.every((g) => g.startsWith("**/"))).toBe(true);
  });
});

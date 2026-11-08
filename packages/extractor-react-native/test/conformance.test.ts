import { runConformance, type ConformanceCase, type TokenLike } from "@dsmith-dev/extractor-api";
import { describe, expect, it } from "vitest";
import { reactNativeExtractor } from "../src/index.js";

const surface: TokenLike = {
  name: "colors.surface",
  value: "#ffffff",
  category: "color",
  normalized: { kind: "color", hex: "#ffffff", l: 1, c: 0, h: 0 },
  js: { module: "src/theme", export: "colors", path: ["surface"] },
};
const sm: TokenLike = {
  name: "spacing.sm",
  value: "8",
  category: "spacing",
  normalized: { kind: "length", px: 8 },
  js: { module: "src/theme", export: "spacing", path: ["sm"] },
};
const cssBlue: TokenLike = {
  name: "--color-blue-500",
  value: "#3b82f6",
  category: "color",
  normalized: { kind: "color", hex: "#3b82f6", l: 0.62, c: 0.2, h: 260 },
};

const header = `import { StyleSheet, Platform } from "react-native";\nimport { colors } from "./theme";\n`;
const expression = { expression: true } as const;

describe("react-native-stylesheet conformance", () => {
  it("메타와 추출·write 왕복 계약을 지킨다", () => {
    const cases: ConformanceCase[] = [
      {
        file: "a.tsx",
        code: `${header}const s = StyleSheet.create({ a: { padding: 8, backgroundColor: "#fff" } });`,
        expect: [
          { property: "padding", source: "hardcoded", normalized: { kind: "length", px: 8 } },
          { property: "background-color", source: "hardcoded" },
        ],
        writes: [
          {
            target: { property: "padding" },
            token: sm,
            ref: "spacing.sm",
            writeOptions: expression,
            output: `${header}const s = StyleSheet.create({ a: { padding: spacing.sm, backgroundColor: "#fff" } });`,
            reextract: { source: "dynamic", property: "padding" },
          },
          {
            target: { property: "background-color" },
            token: surface,
            ref: "colors.surface",
            writeOptions: expression,
            output: `${header}const s = StyleSheet.create({ a: { padding: 8, backgroundColor: colors.surface } });`,
            reextract: { source: "dynamic", property: "background-color", ref: { imported: "colors", path: ["surface"] } },
          },
        ],
      },
      {
        file: "b.tsx",
        code: `${header}const x = <View style={[styles.a, { color: "#fff" }, on && { margin: 4 }]} />;`,
        expect: [],
        writes: [
          {
            target: { property: "color" },
            token: surface,
            ref: "colors.surface",
            writeOptions: expression,
            output: `${header}const x = <View style={[styles.a, { color: colors.surface }, on && { margin: 4 }]} />;`,
            reextract: { source: "dynamic", property: "color" },
          },
          {
            target: { property: "margin" },
            token: sm,
            ref: "spacing.sm",
            writeOptions: expression,
            output: `${header}const x = <View style={[styles.a, { color: "#fff" }, on && { margin: spacing.sm }]} />;`,
            reextract: { source: "dynamic", property: "margin" },
          },
        ],
      },
      {
        file: "c.tsx",
        code: `${header}const s = StyleSheet.create({ a: { ...Platform.select({ ios: { shadowColor: "#fff" } }), paddingTop: Platform.select({ android: 8 }) } });`,
        expect: [],
        writes: [
          {
            target: { property: "color" },
            token: surface,
            ref: "colors.surface",
            writeOptions: expression,
            output: `${header}const s = StyleSheet.create({ a: { ...Platform.select({ ios: { shadowColor: colors.surface } }), paddingTop: Platform.select({ android: 8 }) } });`,
            reextract: { source: "dynamic", property: "color" },
          },
          {
            target: { property: "padding" },
            token: sm,
            ref: "spacing.sm",
            writeOptions: expression,
            output: `${header}const s = StyleSheet.create({ a: { ...Platform.select({ ios: { shadowColor: "#fff" } }), paddingTop: Platform.select({ android: spacing.sm }) } });`,
            reextract: { source: "dynamic", property: "padding" },
          },
        ],
      },
      {
        file: "d.tsx",
        code: `${header}const s = StyleSheet.create({ a: { padding: 8 } });`,
        expect: [],
        writes: [{ target: { property: "padding" }, token: cssBlue, ref: null, reextract: {} }],
      },
    ];
    const report = runConformance("react-native-stylesheet", () => reactNativeExtractor, cases);
    expect(report.failed).toEqual([]);
    expect(report.passed).toBe(4);
  });

  it("jsLocal이 있으면 로컬 이름으로 쓴다", () => {
    const code = `${header}const s = StyleSheet.create({ a: { padding: 8 } });`;
    const usage = reactNativeExtractor.extract({ root: "/", file: "a.tsx", code })[0]!;
    expect(reactNativeExtractor.tokenRef!(sm, usage, { jsLocal: { spacing: "sp" } })).toBe("sp.sm");
    expect(reactNativeExtractor.tokenRef!(sm, usage, {})).toBe("spacing.sm");
  });
});

describe("write 단위", () => {
  const code = `${header}const s = StyleSheet.create({ a: { border: "1px solid #000", color: colors.text, opacity: 0.5, padding: 8 } });`;
  const usages = reactNativeExtractor.extract({ root: "/", file: "a.tsx", code });

  it("문자열의 일부(축약 값)는 표현식으로 바꿀 수 없다", () => {
    const usage = usages.find((u) => u.property === "border-color")!;
    expect(usage.raw).toBe("#000");
    expect(reactNativeExtractor.write(usage, "colors.surface", expression)).toBeNull();
  });

  it("dynamic·점수 밖 usage·타 추출기 usage는 null", () => {
    const dyn = usages.find((u) => u.source === "dynamic")!;
    expect(reactNativeExtractor.write(dyn, "colors.surface", expression)).toBeNull();
    const other = usages.find((u) => u.property === "other")!;
    expect(reactNativeExtractor.write(other, "spacing.sm", expression)).toBeNull();
    const pad = usages.find((u) => u.property === "padding")!;
    expect(reactNativeExtractor.write({ ...pad }, "spacing.sm", expression)).toBeNull();
  });

  it("RN에는 CSS 변수가 없어 JS 토큰이 아니면 tokenRef가 null", () => {
    expect(reactNativeExtractor.tokenRef!(cssBlue, usages[0]!, {})).toBeNull();
  });
});

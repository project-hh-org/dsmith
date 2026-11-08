import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { hasObjectLiteralExport, scanScript, scoreIndependent, themeModuleChecker, type IndepChange } from "../src/independent/index.js";
import { isRnLengthProperty } from "../src/independent/rn.js";
import type { Occurrence } from "../src/independent/types.js";
import { cleanupTmps, tmpDir } from "./helpers.js";

afterAll(cleanupTmps);

const RESOLVER = { baseUrl: ".", paths: { "@/*": ["src/*"] } };
const THEME_KEY = "src/theme";
const scan = (code: string, opts: { file?: string; theme?: (key: string) => boolean } = {}): Occurrence[] =>
  scanScript(code, {
    file: opts.file ?? "src/components/A.tsx",
    resolver: RESOLVER,
    dsModules: ["src/components/ui"],
    themeVars: new Map(),
    isThemeModule: opts.theme ?? ((key) => key === THEME_KEY),
  });
const count = (os: Occurrence[], kind: Occurrence["kind"]): number => os.filter((o) => o.kind === kind).length;
const valuesOf = (os: Occurrence[], kind: Occurrence["kind"]): string[] => os.filter((o) => o.kind === kind).map((o) => o.value).sort();

const SYNTHETIC = `import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

export function A({ active, kind }: { active: boolean; kind: "text" | "muted" }) {
  return (
    <View style={[styles.box, active && { backgroundColor: "#ff0000" }]}>
      <Text style={{ color: colors.text, fontSize: typography.body.fontSize }}>a</Text>
      <Text style={{ color: colors[kind] }}>b</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 12,
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: "#00ff00",
    borderColor: colors.border,
    gap: spacing.md,
    ...typography.caption,
    flex: 1,
    opacity: 0.5,
  },
});
`;

describe("RN 독립 스캐너 — themeRef·색·길이", () => {
  it("합성 산출: hex 2 · 숫자 길이 3 · 멤버 참조 4 · 스프레드 1 · 계산 접근 1을 정확히 센다", () => {
    const os = scan(SYNTHETIC);
    expect(count(os, "color")).toBe(2);
    expect(valuesOf(os, "color")).toEqual(["#00ff00", "#ff0000"]);
    expect(count(os, "length")).toBe(3);
    expect(count(os, "themeRef")).toBe(6);
    expect(valuesOf(os, "themeRef")).toEqual(["colors.border", "colors.text", "colors[]", "spacing.md", "typography.body.fontSize", "typography.caption"]);
    // flex·opacity는 길이가 아니고, styles.box 참조는 세지 않는다
    expect(os).toHaveLength(2 + 3 + 6);
  });

  it("테마 모듈이 아닌 모듈에서 import한 바인딩·패키지 import·같은 파일 StyleSheet 참조는 themeRef가 아니다", () => {
    const os = scan(SYNTHETIC, { theme: () => false });
    expect(count(os, "themeRef")).toBe(0);
    expect(count(os, "color")).toBe(2);
    expect(count(os, "length")).toBe(3);
    const pkg = scan(`import { StyleSheet } from "react-native";\nimport { palette } from "some-ui-kit";\nconst s = StyleSheet.create({ a: { color: palette.red } });\nexport const x = <View style={[s.a, styles.b]} />;`);
    expect(count(pkg, "themeRef")).toBe(0);
  });

  it("테마 import가 없는 파일은 themeRef 0", () => {
    const os = scan(`import { StyleSheet, View } from "react-native";\nconst styles = StyleSheet.create({ a: { backgroundColor: "#fff", padding: 4 } });\nexport const A = () => <View style={styles.a} />;`);
    expect(count(os, "themeRef")).toBe(0);
    expect(count(os, "color")).toBe(1);
    expect(count(os, "length")).toBe(1);
  });

  it("tsconfig paths 별칭(@/theme)으로 import해도 테마 모듈로 풀린다", () => {
    const os = scan(`import { StyleSheet } from "react-native";\nimport { colors } from "@/theme";\nconst s = StyleSheet.create({ a: { color: colors.primary } });`, { file: "app/screen.tsx" });
    expect(valuesOf(os, "themeRef")).toEqual(["colors.primary"]);
  });

  it("스타일 문맥: 조건·논리·배열·Platform.select·함수 본문·*Style 속성·compose·flatten", () => {
    const code = `import { Platform, Pressable, ScrollView, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

const s = StyleSheet.create({
  shadow: Platform.select({ ios: { shadowColor: "#000" }, android: { elevation: 2 } }),
  pad: { padding: Platform.select({ ios: 10, android: 12 }) },
});
export const A = ({ on }: { on: boolean }) => (
  <Pressable
    style={({ pressed }) => [s.pad, pressed && { backgroundColor: "#111111" }, on ? { color: colors.text } : { color: "red" }]}
  >
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: spacing.sm }} />
    <ScrollView style={StyleSheet.flatten([{ margin: 4 }, StyleSheet.compose({ top: 3 }, { color: colors.muted })])} />
  </Pressable>
);
`;
    const os = scan(code);
    expect(valuesOf(os, "color")).toEqual(["#000", "#111111", "red"]);
    expect(valuesOf(os, "length").sort()).toEqual(["10dp", "12dp", "20dp", "3dp", "4dp"]);
    expect(valuesOf(os, "themeRef")).toEqual(["colors.muted", "colors.text", "spacing.sm"]);
  });

  it("산술 안의 숫자는 길이가 아니고 그 안의 테마 참조는 센다. 0과 길이가 아닌 키의 숫자는 세지 않는다", () => {
    const os = scan(`import { StyleSheet } from "react-native";\nimport { spacing } from "../theme";\nconst s = StyleSheet.create({ a: { padding: spacing.md * 2, margin: 0, flexGrow: 3, zIndex: 9, lineHeight: 20, marginLeft: -6 } });`);
    expect(valuesOf(os, "themeRef")).toEqual(["spacing.md"]);
    expect(valuesOf(os, "length")).toEqual(["-6dp"]);
  });

  it("RN 길이 키: 웹 목록과 paddingHorizontal·marginVertical·Start/End 모서리 등", () => {
    for (const k of ["padding", "paddingHorizontal", "paddingVertical", "marginHorizontal", "marginVertical", "paddingStart", "marginEnd", "paddingTop", "borderRadius", "borderTopLeftRadius", "borderTopStartRadius", "borderBottomEndRadius", "borderStartStartRadius", "rowGap", "columnGap", "gap", "width", "fontSize", "borderWidth"]) {
      expect(isRnLengthProperty(k), k).toBe(true);
    }
    for (const k of ["flex", "opacity", "zIndex", "elevation", "lineHeight", "fontWeight", "aspectRatio"]) expect(isRnLengthProperty(k), k).toBe(false);
  });

  it("react-native를 import하지 않는 웹 파일은 RN 스캐너를 타지 않는다: 같은 코드의 웹 결과가 그대로이고 themeRef는 0", () => {
    const web = `import { colors } from "../theme";\nexport const A = () => <div style={{ color: colors.text, padding: 12, background: "#fff" }} />;`;
    const os = scan(web);
    expect(count(os, "themeRef")).toBe(0);
    expect(count(os, "color")).toBe(1);
    expect(count(os, "length")).toBe(1);
  });

  it("RN 파일의 컴포넌트 등장(DS·로컬)은 계속 센다", () => {
    const os = scan(`import { View } from "react-native";\nimport { Card } from "./ui";\nimport { Local } from "./Local";\nexport const A = () => <View><Card /><Local /></View>;`, { file: "src/components/A.tsx" });
    expect(count(os, "dsComp")).toBe(1);
    expect(count(os, "localComp")).toBe(1);
  });
});

describe("hasObjectLiteralExport", () => {
  const has = (code: string, file = "src/theme.ts"): boolean => hasObjectLiteralExport(code, file);
  it("export const X = {…}(as const·satisfies 포함), export default {…}, const X = {…}; export { X }", () => {
    expect(has(`export const colors = { a: "#fff" } as const;`)).toBe(true);
    expect(has(`export const colors = { a: "#fff" } satisfies Record<string, string>;`)).toBe(true);
    expect(has(`export default { a: 1 };`)).toBe(true);
    expect(has(`const theme = { a: 1 };\nexport default theme;`)).toBe(true);
    expect(has(`const theme = { a: 1 };\nexport { theme };`)).toBe(true);
  });
  it("함수·컴포넌트만 export하거나 파싱이 안 되면 false", () => {
    expect(has(`export const f = () => ({ a: 1 });\nexport function g() {}`)).toBe(false);
    expect(has(`export const n = 3;`)).toBe(false);
    expect(has(`export const x = {`)).toBe(false);
    expect(has(`const o = { a: 1 };\nexport const n = 1;`)).toBe(false);
  });
});

describe("themeModuleChecker — 스냅샷 없이 파일 내용으로 판정", () => {
  it("확장자·index 해석, overlay(에이전트가 바꾼 파일) 우선, 삭제된 파일은 없음", () => {
    const root = tmpDir("dsmith-bench-theme-");
    fs.mkdirSync(path.join(root, "src/theme"), { recursive: true });
    fs.writeFileSync(path.join(root, "src/theme.ts"), `export const colors = { a: "#fff" };`);
    fs.writeFileSync(path.join(root, "src/theme/index.ts"), `export const x = 1;`);
    fs.writeFileSync(path.join(root, "src/util.ts"), `export const f = () => 1;`);
    const check = themeModuleChecker(root, new Map(), new Set());
    expect(check("src/theme")).toBe(true);
    expect(check("src/util")).toBe(false);
    expect(check("src/missing")).toBe(false);
    expect(themeModuleChecker(root, new Map([["src/util.ts", `export const o = { a: 1 };`]]), new Set())("src/util")).toBe(true);
    expect(themeModuleChecker(root, new Map(), new Set(["src/theme.ts"]))("src/theme")).toBe(false);
  });
});

describe("scoreIndependent — themeRefs가 독립 사용률에 들어간다", () => {
  const base = { dsModules: [] as string[], cssFiles: {}, resolver: RESOLVER, themeVars: new Map<string, string>(), isThemeModule: (k: string) => k === THEME_KEY };
  const added = (file: string, after: string): IndepChange => ({ file, status: "added", before: null, after });

  it("indepUsage = (var 정의 + themeRefs) / (var 둘 + 색 + 길이 + 팔레트 + themeRefs)", () => {
    const s = scoreIndependent({ ...base, changes: [added("src/components/A.tsx", SYNTHETIC)] });
    expect(s.totals).toMatchObject({ themeRefs: 6, colorLiterals: 2, lengthLiterals: 3, varDefined: 0, varUndefined: 0 });
    expect(s.indepUsage).toBe(0.5455); // 6 / 11
  });

  it("수정 파일은 before 대비 다중집합 차(옮기기만 하면 0)", () => {
    const before = `import { StyleSheet } from "react-native";\nimport { colors } from "../theme";\nconst s = StyleSheet.create({ a: { color: colors.text, padding: 4 } });\n`;
    const after = `${before}const t = StyleSheet.create({ b: { color: colors.text, backgroundColor: "#fff" } });\n`;
    const s = scoreIndependent({ ...base, changes: [{ file: "src/components/A.tsx", status: "modified", before, after }] });
    expect(s.totals).toMatchObject({ themeRefs: 1, colorLiterals: 1, lengthLiterals: 0 });
  });

  it("웹 파일만 있으면 themeRefs 0이고 식이 이전과 같다(분모에 0이 더해질 뿐)", () => {
    const web = `export const A = () => <div className="p-4 bg-[#fff]" style={{ color: "var(--x)" }} />;`;
    const s = scoreIndependent({ ...base, cssFiles: { "src/a.css": ":root { --x: red; }" }, changes: [added("src/components/A.tsx", web)] });
    expect(s.totals.themeRefs).toBe(0);
    const den = s.totals.varDefined + s.totals.varUndefined + s.totals.colorLiterals + s.totals.lengthLiterals + s.totals.tailwindPalette;
    expect(den).toBeGreaterThan(0);
    expect(s.indepUsage).toBe(Math.round((s.totals.varDefined / den) * 10_000) / 10_000);
  });

  it("isThemeModule을 주지 않으면 themeRef는 0", () => {
    const { isThemeModule: _omit, ...noTheme } = base;
    const s = scoreIndependent({ ...noTheme, changes: [added("src/components/A.tsx", SYNTHETIC)] });
    expect(s.totals.themeRefs).toBe(0);
  });
});

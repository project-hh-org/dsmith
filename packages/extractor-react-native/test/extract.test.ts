import { JS_FILES, metaOf } from "@dsmith-dev/extractor-api";
import type { StyleUsage } from "@dsmith-dev/extractor-api";
import { describe, expect, it } from "vitest";
import { classifyRnKey, EXTRACTOR_NAME, reactNativeExtractor } from "../src/index.js";

const header = `import { StyleSheet, Platform } from "react-native";\nimport { colors, spacing, typography } from "../theme";\n`;

function run(body: string, file = "Screen.tsx"): StyleUsage[] {
  return reactNativeExtractor.extract({ root: "/", file, code: `${header}${body}` });
}

function brief(u: StyleUsage) {
  return [u.property, u.raw, u.source] as const;
}

describe("reactNativeExtractor 메타", () => {
  it("이름·signals·appliesTo", () => {
    expect(EXTRACTOR_NAME).toBe("react-native-stylesheet");
    expect(metaOf(reactNativeExtractor)).toEqual({
      name: "react-native-stylesheet",
      files: JS_FILES,
      parses: "tsx",
      signals: { dependencies: ["react-native"], code: "StyleSheet\\.create\\(" },
    });
    const applies = (file: string, code: string) => reactNativeExtractor.appliesTo({ root: "/", file, code });
    expect(applies("a.tsx", "StyleSheet.create({})")).toBe(true);
    expect(applies("a.tsx", "<View style={x} />")).toBe(true);
    expect(applies("a.tsx", "<List contentContainerStyle={x} />")).toBe(true);
    expect(applies("a.tsx", "const a = 1;")).toBe(false);
    expect(applies("a.css", "StyleSheet.create({})")).toBe(false);
  });
});

describe("classifyRnKey", () => {
  it("색 키만 color, 점수 밖 키는 other, 나머지는 기본 분류에 맡긴다", () => {
    expect(classifyRnKey("shadowColor")).toBe("color");
    expect(classifyRnKey("textShadowColor")).toBe("color");
    expect(classifyRnKey("tintColor")).toBe("color");
    expect(classifyRnKey("overlayColor")).toBe("color");
    expect(classifyRnKey("elevation")).toBe("other");
    expect(classifyRnKey("borderWidth")).toBe("other");
    expect(classifyRnKey("paddingHorizontal")).toBeUndefined();
    expect(classifyRnKey("color")).toBeUndefined();
  });
});

describe("StyleSheet.create", () => {
  it("클래스 객체의 값을 속성별로 분류한다", () => {
    const usages = run(`const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, marginStart: -4, borderTopLeftRadius: 6, shadowColor: "#000", elevation: 2, fontWeight: "700", flex: 1 },
});`);
    expect(usages.map((u) => [u.property, u.raw, u.source, u.normalized.kind])).toEqual([
      ["padding", "16", "hardcoded", "length"],
      ["margin", "-4", "hardcoded", "length"],
      ["border-radius", "6", "hardcoded", "length"],
      ["color", "#000", "hardcoded", "color"],
      ["other", "2", "hardcoded", "unknown"],
      ["other", "700", "hardcoded", "unknown"],
      ["other", "1", "hardcoded", "unknown"],
    ]);
    expect(usages[0]).toMatchObject({ normalized: { kind: "length", px: 16 }, extractor: "react-native-stylesheet" });
    expect(usages[3]).toMatchObject({ normalized: { kind: "color", hex: "#000000" } });
  });

  it("테마 멤버 식은 dynamic이고 import 바인딩에서 시작하면 ref가 붙는다", () => {
    const usages = run(`const styles = StyleSheet.create({
  a: { color: colors.text, padding: spacing[2], margin: local.x, gap: colors.mode[k] },
});`);
    expect(usages.map(brief)).toEqual([
      ["color", "colors.text", "dynamic"],
      ["padding", "spacing[2]", "dynamic"],
      ["margin", "local.x", "dynamic"],
      ["gap", "colors.mode[k]", "dynamic"],
    ]);
    expect(usages[0]!.ref).toEqual({ specifier: "../theme", imported: "colors", path: ["text"] });
    expect(usages[1]!.ref).toEqual({ specifier: "../theme", imported: "spacing", path: ["2"] });
    expect(usages[2]!.ref).toBeUndefined();
    expect(usages[3]!.ref).toBeUndefined();
  });

  it("스프레드 멤버 식은 ref.spread를 단 other dynamic 한 건", () => {
    const usages = run(`const styles = StyleSheet.create({ title: { ...typography.caption, color: "#111" } });`);
    expect(usages.map(brief)).toEqual([
      ["other", "typography.caption", "dynamic"],
      ["color", "#111", "hardcoded"],
    ]);
    expect(usages[0]!.ref).toEqual({ specifier: "../theme", imported: "typography", path: ["caption"], spread: true });
  });

  it("transform 배열과 중첩 객체(shadowOffset)는 재귀하지 않고 other dynamic", () => {
    const usages = run(`const styles = StyleSheet.create({ a: { transform: [{ translateY: 4 }], shadowOffset: { width: 0, height: 2 } } });`);
    expect(usages.map((u) => [u.property, u.source])).toEqual([
      ["other", "dynamic"],
      ["other", "dynamic"],
    ]);
  });

  it("StyleSheet.hairlineWidth는 dynamic", () => {
    const usages = run(`const styles = StyleSheet.create({ line: { borderBottomWidth: StyleSheet.hairlineWidth, height: 10 } });`);
    expect(usages.map(brief)).toEqual([
      ["other", "StyleSheet.hairlineWidth", "dynamic"],
      ["height", "10", "hardcoded"],
    ]);
  });

  it("제네릭 호출과 컴포넌트 밖 정의도 읽는다", () => {
    const usages = run(`const s = StyleSheet.create<Styles>({ a: { padding: 8 } });`);
    expect(usages.map(brief)).toEqual([["padding", "8", "hardcoded"]]);
  });
});

describe("style prop", () => {
  it("style={styles.a}는 dynamic other 한 건", () => {
    const usages = run(`const x = <View style={styles.a} />;`);
    expect(usages.map(brief)).toEqual([["other", "styles.a", "dynamic"]]);
  });

  it("배열은 원소별: 참조 1건 + 객체 값 + 조건식 가지", () => {
    const usages = run(`const x = <View style={[styles.a, { gap: 4 }, on && { opacity: 0.5 }]} />;`);
    expect(usages.map(brief)).toEqual([
      ["other", "styles.a", "dynamic"],
      ["gap", "4", "hardcoded"],
      ["other", "0.5", "hardcoded"],
    ]);
  });

  it("삼항식의 두 가지를 모두 읽고 조건 자체는 세지 않는다", () => {
    const usages = run(`const x = <View style={on ? { padding: 4 } : { padding: 8 }} />;`);
    expect(usages.map(brief)).toEqual([
      ["padding", "4", "hardcoded"],
      ["padding", "8", "hardcoded"],
    ]);
  });

  it("*Style prop도 읽는다", () => {
    const usages = run(`const x = <ScrollView contentContainerStyle={{ padding: 12 }} labelStyle={{ color: "#222" }} />;`);
    expect(usages.map(brief)).toEqual([
      ["padding", "12", "hardcoded"],
      ["color", "#222", "hardcoded"],
    ]);
  });

  it("style이 아닌 prop은 무시한다", () => {
    expect(run(`const x = <View hitSlop={{ top: 8 }} data={{ padding: 4 }} />;`)).toEqual([]);
  });

  it("undefined·null·false 같은 비참조 원소는 세지 않는다", () => {
    expect(run(`const x = <View style={[undefined, null, false]} />;`)).toEqual([]);
  });

  it("StyleSheet.flatten/compose 인자의 객체 리터럴을 읽고 같은 노드를 두 번 세지 않는다", () => {
    const usages = run(`const x = <View style={StyleSheet.flatten([styles.a, { margin: 2 }])} />;
const y = StyleSheet.compose(styles.a, { margin: 3 });`);
    expect(usages.map(brief)).toEqual([
      ["other", "styles.a", "dynamic"],
      ["margin", "2", "hardcoded"],
      ["other", "styles.a", "dynamic"],
      ["margin", "3", "hardcoded"],
    ]);
  });
});

describe("Platform.select", () => {
  it("스프레드된 Platform.select의 값 객체를 읽는다", () => {
    const usages = run(`const styles = StyleSheet.create({
  box: { ...Platform.select({ ios: { shadowColor: "#111" }, android: { elevation: 3 } }) },
});`);
    expect(usages.map(brief)).toEqual([
      ["color", "#111", "hardcoded"],
      ["other", "3", "hardcoded"],
    ]);
  });

  it("속성 값 위치의 Platform.select는 그 키로 분류한다", () => {
    const usages = run(`const styles = StyleSheet.create({ box: { paddingTop: Platform.select({ ios: 20, android: 10 }) } });`);
    expect(usages.map(brief)).toEqual([
      ["padding", "20", "hardcoded"],
      ["padding", "10", "hardcoded"],
    ]);
  });

  it("style prop 값이 Platform.select여도 읽는다", () => {
    const usages = run(`const x = <View style={Platform.select({ web: { gap: 6 } })} />;`);
    expect(usages.map(brief)).toEqual([["gap", "6", "hardcoded"]]);
  });
});

describe("출력 순서", () => {
  it("소스 위치 순서로 안정적이다", () => {
    const usages = run(`const styles = StyleSheet.create({ a: { padding: 1, ...Platform.select({ ios: { margin: 2 } }), gap: 3 } });`);
    expect(usages.map((u) => u.raw)).toEqual(["1", "2", "3"]);
  });
});

import { runConformance } from "@dsmith-dev/extractor-api";
import { describe, expect, it } from "vitest";
import { inlineStyleExtractor } from "../src/index.js";

function extractOne(code: string, property: string) {
  const usages = inlineStyleExtractor.extract({ root: "/", file: "w.tsx", code });
  const usage = usages.find((u) => u.property === property);
  if (usage === undefined) throw new Error(`usage 없음: ${property}`);
  return usage;
}

describe("inlineStyleExtractor.write", () => {
  const code = `const x = <div style={{ color: "#3B82F6", padding: 12, margin: theme.m }} />;`;

  it("문자열 리터럴 패치는 따옴표 안 값 구간을 tokenRef 그대로 치환한다", () => {
    const patch = inlineStyleExtractor.write(extractOne(code, "color"), "var(--color-primary-500)");
    expect(patch).not.toBeNull();
    expect(code.slice(patch!.start, patch!.end)).toBe("#3B82F6");
    expect(patch!.replacement).toBe("var(--color-primary-500)");
    expect(patch!.file).toBe("w.tsx");
  });

  it("축약 값은 색 토큰 구간만 치환한다", () => {
    const src = `const x = <div style={{ border: "1px solid #ef4444" }} />;`;
    const usage = inlineStyleExtractor.extract({ root: "/", file: "b.tsx", code: src })[0]!;
    expect(usage).toMatchObject({ property: "border-color", raw: "#ef4444" });
    const patch = inlineStyleExtractor.write(usage, "var(--danger)")!;
    expect(src.slice(0, patch.start) + patch.replacement + src.slice(patch.end)).toBe(
      `const x = <div style={{ border: "1px solid var(--danger)" }} />;`,
    );
  });

  it("숫자 리터럴도 치환 패치를 만든다", () => {
    const patch = inlineStyleExtractor.write(extractOne(code, "padding"), "var(--space-3)");
    expect(code.slice(patch!.start, patch!.end)).toBe("12");
    expect(patch!.replacement).toBe(`"var(--space-3)"`);
  });

  it("패치를 적용하면 유효한 코드가 된다", () => {
    const patch = inlineStyleExtractor.write(extractOne(code, "color"), "var(--c)")!;
    const out = code.slice(0, patch.start) + patch.replacement + code.slice(patch.end);
    expect(out).toBe(`const x = <div style={{ color: "var(--c)", padding: 12, margin: theme.m }} />;`);
  });

  it("음수 리터럴은 단항식 전체 구간을 치환한다", () => {
    const neg = `const x = <div style={{ margin: -4 }} />;`;
    const usage = inlineStyleExtractor.extract({ root: "/", file: "n.tsx", code: neg })[0]!;
    const patch = inlineStyleExtractor.write(usage, "var(--space-neg)")!;
    expect(neg.slice(patch.start, patch.end)).toBe("-4");
    expect(patch.replacement).toBe(`"var(--space-neg)"`);
  });

  it("dynamic usage에는 null을 돌려준다", () => {
    expect(inlineStyleExtractor.write(extractOne(code, "margin"), "var(--m)")).toBeNull();
  });

  it("추출기가 만들지 않은 usage에는 null을 돌려준다", () => {
    const foreign = { ...extractOne(code, "color") };
    expect(inlineStyleExtractor.write(foreign, "var(--c)")).toBeNull();
  });
});

describe("inlineStyleExtractor.write: 점수 대상이 아닌 usage", () => {
  it("other 속성(content·fontFamily·boxShadow·opacity 숫자)과 정규화 안 된 값은 null", () => {
    const code = `const x = <div style={{ content: "가😀", fontFamily: "Inter", boxShadow: "0 1px 2px #000", opacity: 0.5, width: "calc(100% - 8px)", padding: "13px 8px" }} />;`;
    const usages = inlineStyleExtractor.extract({ root: "/", file: "w.tsx", code });
    expect(usages.map((u) => [u.property, inlineStyleExtractor.write(u, "var(--x)") === null])).toEqual([
      ["other", true],
      ["other", true],
      ["other", true],
      ["other", true],
      ["width", true],
      // "13px 8px"는 피연산자마다 usage(13px·8px)
      ["padding", false],
      ["padding", false],
    ]);
  });
});

describe("inlineStyleExtractor.tokenRef + conformance write 왕복", () => {
  const blue = { name: "--color-blue-500", value: "#3b82f6", category: "color" as const, normalized: { kind: "color" as const, hex: "#3b82f6", l: 0.62, c: 0.2, h: 260 } };
  const space = { name: "--space-2", value: "8px", category: "spacing" as const, normalized: { kind: "length" as const, px: 8 } };
  const radius = { name: "--radius-sm", value: "4px", category: "radius" as const, normalized: { kind: "length" as const, px: 4 } };
  const text = { name: "--text-xs", value: "12px", category: "font-size" as const, normalized: { kind: "length" as const, px: 12 } };

  it("숫자 노드는 문자열로 감싸 치환되고 token으로 재추출된다", () => {
    const report = runConformance("inline-style", () => inlineStyleExtractor, [
      {
        file: "w.tsx",
        code: 'const x = <div style={{ padding: 8, color: "#3b82f6", borderRadius: 4, fontSize: 12 }} />;',
        expect: [],
        writes: [
          { target: { property: "padding" }, token: space, ref: "var(--space-2)", output: 'const x = <div style={{ padding: "var(--space-2)", color: "#3b82f6", borderRadius: 4, fontSize: 12 }} />;', reextract: { source: "token", property: "padding" } },
          { target: { property: "color" }, token: blue, ref: "var(--color-blue-500)", output: 'const x = <div style={{ padding: 8, color: "var(--color-blue-500)", borderRadius: 4, fontSize: 12 }} />;', reextract: { source: "token", property: "color" } },
          { target: { property: "border-radius" }, token: radius, ref: "var(--radius-sm)", reextract: { source: "token", property: "border-radius" } },
          { target: { property: "font-size" }, token: text, ref: "var(--text-xs)", reextract: { source: "token", property: "font-size" } },
        ],
      },
      {
        file: "w.tsx",
        code: 'const x = <div style={{ background: "#3b82f6" }} />;',
        expect: [],
        writes: [{ target: { raw: "#3b82f6" }, token: blue, ref: "var(--color-blue-500)", output: 'const x = <div style={{ background: "var(--color-blue-500)" }} />;', reextract: { source: "token", property: "background-color" } }],
      },
      {
        file: "w.tsx",
        code: 'const x = <div style={{ color: "#3b82f6" }} />;',
        expect: [],
        writes: [{ target: { property: "color" }, token: { ...blue, name: "color.brand" }, ref: null, reextract: {} }],
      },
    ]);
    expect(report.failed).toEqual([]);
    expect(report.passed).toBe(3);
  });
});

describe("inlineStyleExtractor: JS 테마 토큰(표현식 치환)", () => {
  const surface = {
    name: "colors.surface",
    value: "#ffffff",
    category: "color" as const,
    normalized: { kind: "color" as const, hex: "#ffffff", l: 1, c: 0, h: 0 },
    js: { module: "src/theme", export: "colors", path: ["surface"] },
  };
  const sm = {
    name: "spacing.sm",
    value: "8",
    category: "spacing" as const,
    normalized: { kind: "length" as const, px: 8 },
    js: { module: "src/theme", export: "spacing", path: ["sm"] },
  };
  const header = `import { colors } from "./theme";\n`;

  it("hex·숫자를 JS 식으로 치환하고 재추출하면 ref가 남은 dynamic이다", () => {
    const report = runConformance("inline-style", () => inlineStyleExtractor, [
      {
        file: "w.tsx",
        code: `${header}const x = <div style={{ color: "#fff", padding: 8 }} />;`,
        expect: [],
        writes: [
          {
            target: { property: "color" },
            token: surface,
            ref: "colors.surface",
            writeOptions: { expression: true },
            output: `${header}const x = <div style={{ color: colors.surface, padding: 8 }} />;`,
            reextract: { source: "dynamic", property: "color", ref: { specifier: "./theme", imported: "colors", path: ["surface"] } },
          },
          {
            target: { property: "padding" },
            token: sm,
            ref: "spacing.sm",
            writeOptions: { expression: true },
            output: `${header}const x = <div style={{ color: "#fff", padding: spacing.sm }} />;`,
            reextract: { source: "dynamic", property: "padding" },
          },
        ],
      },
    ]);
    expect(report.failed).toEqual([]);
  });

  it("jsLocal이 있으면 로컬 이름(별칭)으로 쓴다", () => {
    const code = `${header}const x = <div style={{ color: "#fff" }} />;`;
    const usage = inlineStyleExtractor.extract({ root: "/", file: "w.tsx", code })[0]!;
    expect(inlineStyleExtractor.tokenRef!(surface, usage, { jsLocal: { colors: "c" } })).toBe("c.surface");
  });

  it("축약 문자열의 일부는 표현식으로 바꿀 수 없다(null)", () => {
    const code = `${header}const x = <div style={{ border: "1px solid #000" }} />;`;
    const usage = inlineStyleExtractor.extract({ root: "/", file: "w.tsx", code })[0]!;
    expect(usage.property).toBe("border-color");
    expect(inlineStyleExtractor.write(usage, "colors.surface", { expression: true })).toBeNull();
  });

  it("CSS 변수 토큰은 표현식 옵션이 없으면 그대로 var() 문자열 치환", () => {
    const code = `const x = <div style={{ padding: 8 }} />;`;
    const usage = inlineStyleExtractor.extract({ root: "/", file: "w.tsx", code })[0]!;
    expect(inlineStyleExtractor.write(usage, "var(--s)")!.replacement).toBe(`"var(--s)"`);
  });

  it("import 바인딩에서 시작하는 멤버 식만 ref가 붙는다", () => {
    const code = `${header}const local = { a: "#000" };\nconst x = <div style={{ color: colors.surface, background: local.a, margin: colors.mode[k] }} />;`;
    const usages = inlineStyleExtractor.extract({ root: "/", file: "w.tsx", code });
    expect(usages.map((u) => [u.raw, u.ref?.path])).toEqual([
      ["colors.surface", ["surface"]],
      ["local.a", undefined],
      ["colors.mode[k]", undefined],
    ]);
    expect(usages[0]!.ref).toEqual({ specifier: "./theme", imported: "colors", path: ["surface"] });
  });
});

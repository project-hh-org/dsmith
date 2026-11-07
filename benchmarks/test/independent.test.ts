import { describe, expect, it } from "vitest";
import { declaredCustomProperties, scanCss, scanColors, scanLengths, scanScript, scanVarRefs, scoreIndependent, NAMED_COLORS, type IndepChange } from "../src/independent/index.js";
import { classStringOccurrences, cssTextOccurrences } from "../src/independent/index.js";
import { isDsModule, moduleKey, resolveLocal } from "../src/independent/resolve.js";
import { PALETTE_PATTERNS, arbitraryValue, classTokens, normalizeUtility, paletteKind, readThemeVarKeys, splitVariants, themeVarOf } from "../src/independent/tailwind.js";
import { multisetNew } from "../src/independent/score.js";
import type { Occurrence } from "../src/independent/types.js";

const RESOLVER = { baseUrl: "", paths: { "@/*": ["./src/*"] } };
const DS = ["src/components/ui", "design-system/components/Badge"];
const THEME = new Map([
  ["ds-4", "--space-4"],
  ["ds-blue-400", "--color-blue-400"],
  ["ds-xs", "--text-xs"],
]);

const scan = (code: string, file = "src/components/X.tsx"): Occurrence[] =>
  scanScript(code, { file, resolver: RESOLVER, dsModules: DS, themeVars: THEME });
const values = (os: Occurrence[], kind: Occurrence["kind"]): string[] => os.filter((o) => o.kind === kind).map((o) => o.value);

describe("(a) 색 리터럴", () => {
  it("hex 3·4·6·8자리만, 5자리·16진이 아닌 것은 제외", () => {
    expect(scanColors("#fff #FFAA00 #abcd #11223344 #12345 #ggg", { named: false })).toEqual(["#fff", "#ffaa00", "#abcd", "#11223344"]);
  });
  it("&#123; 엔티티·url(#id)·단어에 붙은 #은 색이 아니다", () => {
    expect(scanColors("&#123; url(#fff) a#abc", { named: false })).toEqual([]);
  });
  it("rgb·rgba·hsl·hsla·oklch 함수(인자 포함, 공백 정규화·소문자)", () => {
    expect(scanColors("RGB(0  0 0 / 50%) rgba(1,2,3,.5) hsl(10 20% 30%) hsla(1,2%,3%,.4) oklch(0.5 0.1 200)", { named: false })).toEqual([
      "rgb(0 0 0 / 50%)",
      "rgba(1,2,3,.5)",
      "hsl(10 20% 30%)",
      "hsla(1,2%,3%,.4)",
      "oklch(0.5 0.1 200)",
    ]);
  });
  it("이름 색은 named가 켜진 때만, 하이픈·var 이름에 든 단어는 제외", () => {
    expect(scanColors("1px solid red", { named: true })).toEqual(["red"]);
    expect(scanColors("1px solid red", { named: false })).toEqual([]);
    expect(scanColors("var(--color-red) redish transparent inherit currentColor", { named: true })).toEqual([]);
    expect(scanColors("linear-gradient(to right, Tomato, #000)", { named: true })).toEqual(["tomato", "#000"]);
    expect(NAMED_COLORS).toContain("rebeccapurple");
    expect(NAMED_COLORS).not.toContain("transparent");
  });
});

describe("(b) 길이 리터럴", () => {
  it("px·rem, 0은 제외, 단위 대소문자 무시", () => {
    expect(scanLengths("16px 1.5rem 0px .5rem -4px 12PX 0.0rem 50% 2em")).toEqual(["16px", "1.5rem", ".5rem", "-4px", "12px"]);
  });
  it("url() 안은 제외", () => {
    expect(scanLengths("url(a-16px.png) 4px")).toEqual(["4px"]);
  });
});

describe("(d) var 참조", () => {
  it("var(--a) var( --b, fallback)", () => {
    expect(scanVarRefs("calc(var(--a) + var( --b-c, 4px))")).toEqual(["--a", "--b-c"]);
  });
});

describe("(c) Tailwind 팔레트·스케일 — 고정 정규식 목록", () => {
  const yes = [
    "bg-blue-500", "text-gray-700", "border-white", "ring-red-300", "p-4", "mt-0.5", "gap-2", "w-64", "h-px", "space-x-4", "max-w-md",
    "text-sm", "text-2xl", "font-bold", "leading-6", "leading-tight", "tracking-wide", "rounded", "rounded-md", "rounded-t-lg", "rounded-full",
    "shadow", "shadow-md", "border-2", "ring-4", "border-t-0", "opacity-50",
  ];
  const no = ["gap-ds-4", "bg-ds-blue-400", "text-ds-xs", "rounded-ds-sm", "flex", "w-full", "border", "text-center", "p-[13px]", "bg-brand", "w-1/2", "items-center", "bg-[#fff]"];
  it.each(yes)("%s는 팔레트·스케일", (cls) => {
    expect(paletteKind(cls)).not.toBeNull();
  });
  it.each(no)("%s는 아니다", (cls) => {
    expect(paletteKind(cls)).toBeNull();
  });
  it("모든 패턴에 이름과 예가 있다", () => {
    for (const p of PALETTE_PATTERNS) {
      expect(p.name).not.toBe("");
      expect(p.example).not.toBe("");
    }
  });
  it("변형·중요·음수·불투명도 정리", () => {
    expect(splitVariants("sm:hover:bg-blue-500")).toEqual({ variants: ["sm", "hover"], utility: "bg-blue-500" });
    expect(splitVariants("[&>p]:text-sm")).toEqual({ variants: ["[&>p]"], utility: "text-sm" });
    expect(splitVariants("data-[state=open]:p-4").utility).toBe("p-4");
    expect(splitVariants("text-[color:var(--c)]").utility).toBe("text-[color:var(--c)]");
    expect(normalizeUtility("!-mt-4/50")).toBe("mt-4");
    expect(normalizeUtility("bg-black/50")).toBe("bg-black");
    expect(normalizeUtility("w-[calc(100%/3)]")).toBe("w-[calc(100%/3)]");
    expect(classTokens("  a  b\nc ")).toEqual(["a", "b", "c"]);
    expect(arbitraryValue("text-[color:var(--c)]")).toEqual({ prefix: "text-", inner: "color:var(--c)" });
    expect(arbitraryValue("p-4")).toBeNull();
  });
  it("테마 키 클래스는 가장 긴 키의 var로 풀린다", () => {
    expect(themeVarOf("gap-ds-4", THEME)).toBe("--space-4");
    expect(themeVarOf("bg-ds-blue-400", THEME)).toBe("--color-blue-400");
    expect(themeVarOf("p-4", THEME)).toBeNull();
    expect(themeVarOf("ds-4", THEME)).toBeNull();
  });
  it("프리셋 텍스트에서 키 → var 이름만 읽고 hex 값 키는 무시", () => {
    const m = readThemeVarKeys(`colors: { "ds-blue-400": "var(--color-blue-400)", brand: "#3B82F6" }, spacing: { 'ds-2': 'var(--space-2)' }`);
    expect([...m]).toEqual([
      ["ds-blue-400", "--color-blue-400"],
      ["ds-2", "--space-2"],
    ]);
  });
});

describe("스크립트 스캔 — 문맥", () => {
  it("style 객체의 색(hex·함수·이름 색)", () => {
    const o = scan(`export const A = () => <div style={{ color: "#fff", background: "rgb(1,2,3)", borderColor: "red", content: "red" }} />;`);
    expect(values(o, "color")).toEqual(["#fff", "rgb(1,2,3)", "red"]);
  });
  it("사용자 문구의 #123·p-4는 세지 않는다", () => {
    const o = scan(`const label = "Order #123 p-4 사이즈"; export const A = () => <p title="bg-blue-500">{label} 16px</p>;`);
    expect(o).toEqual([]);
  });
  it("className 임의 값: 색·길이·var", () => {
    const o = scan(`export const A = () => <div className="bg-[#fff] text-[color:var(--c)] p-[13px] w-[2rem] text-[red]" />;`);
    expect(values(o, "color")).toEqual(["#fff", "red"]);
    expect(values(o, "length")).toEqual(["13px", "2rem"]);
    expect(values(o, "var")).toEqual(["--c"]);
    expect(values(o, "palette")).toEqual([]);
  });
  it("템플릿 리터럴과 조건식 안의 클래스", () => {
    const o = scan("export const A = ({ x }: { x: boolean }) => <div className={`p-4 ${x ? \"bg-red-500\" : \"bg-[#000]\"}`} />;");
    expect(values(o, "palette")).toEqual(["p-4", "bg-red-500"]);
    expect(values(o, "color")).toEqual(["#000"]);
  });
  it("styled·css 태그드 템플릿", () => {
    const o = scan("import styled from 'styled-components';\nconst B = styled.div`\n  color: #333;\n  padding: 8px;\n  margin: var(--space-2);\n  &:hover { background: blue; }\n  ${(p) => p.x};\n`;");
    expect(values(o, "color")).toEqual(["#333", "blue"]);
    expect(values(o, "length")).toEqual(["8px"]);
    expect(values(o, "var")).toEqual(["--space-2"]);
  });
  it("숫자 스타일: 길이 속성만 px로, 0·unitless 속성 제외", () => {
    const o = scan(`export const A = () => <div style={{ padding: 16, margin: 0, zIndex: 3, fontSize: 14, lineHeight: 1.5, borderRadius: 4 }} />;`);
    expect(values(o, "length")).toEqual(["16px", "14px", "4px"]);
  });
  it("Tailwind 기본 클래스 + 테마 키 클래스(var로 풀림)", () => {
    const o = scan(`export const A = () => <div className="flex p-4 text-sm rounded-md hover:bg-blue-500 gap-ds-4 w-full" />;`);
    expect(values(o, "palette")).toEqual(["p-4", "text-sm", "rounded-md", "bg-blue-500"]);
    expect(values(o, "var")).toEqual(["--space-4"]);
  });
  it("var 참조: 클래스 임의 값과 style 문자열", () => {
    const o = scan(`export const A = () => <div className="gap-[var(--space-5)]" style={{ color: "var(--missing)" }} />;`);
    expect(values(o, "var")).toEqual(["--space-5", "--missing"]);
  });
  it("className에 쓰인 변수의 초기값도 클래스 문맥", () => {
    const o = scan(`const priceInput = "w-full p-4 border-2";\nconst other = "p-8";\nexport const A = () => <input className={priceInput} />;`);
    expect(values(o, "palette")).toEqual(["p-4", "border-2"]);
  });
  it("style에 쓰인 변수(스프레드 포함)의 초기값도 스타일 문맥", () => {
    const o = scan(`const cell = { padding: "4px 8px", color: "#111" };\nexport const A = () => <td style={{ ...cell, textAlign: "right" }} />;`);
    expect(values(o, "length")).toEqual(["4px", "8px"]);
    expect(values(o, "color")).toEqual(["#111"]);
  });
  it("clsx·cn 인자와 객체 키", () => {
    const o = scan(`import clsx from "clsx";\nexport const A = ({ a }: { a: boolean }) => <div className={clsx("p-4", { "bg-blue-500": a })} />;\nconst x = cn("m-2");`);
    expect(values(o, "palette")).toEqual(["p-4", "bg-blue-500", "m-2"]);
  });
  it("SVG 색 속성", () => {
    const o = scan(`export const A = () => <svg><path fill="#e53e3e" stroke="currentColor" /></svg>;`);
    expect(values(o, "color")).toEqual(["#e53e3e"]);
  });
  it(".ts 파일(제네릭)과 .jsx 파일을 파싱한다", () => {
    expect(values(scan(`export const f = <T,>(x: T) => ({ color: "#abc" } as { color: string });`, "src/lib/f.ts"), "color")).toEqual([]);
    expect(values(scan(`const s = <div style={{ color: "#abc" }} />;`, "src/a.jsx"), "color")).toEqual(["#abc"]);
  });
  it("문법 오류는 던진다", () => {
    expect(() => scan(`const = ;`)).toThrow();
  });
});

describe("(e) 컴포넌트", () => {
  const code = [
    `import { Button } from "./ui/button";`,
    `import { Dialog } from "@/components/ui/dialog";`,
    `import { StatusBadge } from "./common/StatusBadge";`,
    `import { Fragment } from "react";`,
    `import Legacy from "../legacy/PrimaryButton";`,
    `const Local = () => null;`,
    `export const A = () => (`,
    `  <Fragment><Button /><Button /><Dialog.Content /><StatusBadge /><Legacy /><Local /><div /></Fragment>`,
    `);`,
  ].join("\n");
  it("DS 모듈로 풀리면 dsComp, 다른 로컬이면 localComp, 패키지·파일 안 정의는 제외", () => {
    const o = scan(code);
    expect(values(o, "dsComp")).toEqual(["Button|src/components/ui/button", "Button|src/components/ui/button", "Dialog|src/components/ui/dialog"]);
    expect(values(o, "localComp")).toEqual(["StatusBadge|src/components/common/StatusBadge", "Legacy|src/legacy/PrimaryButton"]);
  });
  it("import 해석: 상대·별칭·index·확장자·root 밖", () => {
    expect(resolveLocal("src/components/X.tsx", "./ui/button.tsx", RESOLVER)).toBe("src/components/ui/button");
    expect(resolveLocal("src/components/X.tsx", "../lib/index", RESOLVER)).toBe("src/lib");
    expect(resolveLocal("src/components/X.tsx", "@/lib/format", RESOLVER)).toBe("src/lib/format");
    expect(resolveLocal("src/components/X.tsx", "react", RESOLVER)).toBeNull();
    expect(resolveLocal("a.tsx", "../outside", RESOLVER)).toBeNull();
    expect(resolveLocal("src/a.tsx", "~/x", { baseUrl: "", paths: {} })).toBeNull();
    expect(moduleKey("./src/components/ui/index.tsx")).toBe("src/components/ui");
    expect(isDsModule("src/components/ui/button", DS)).toBe(true);
    expect(isDsModule("src/components/uikit", DS)).toBe(false);
    expect(isDsModule("design-system/components/Badge", DS)).toBe(true);
  });
});

describe("CSS", () => {
  const css = ".a{color:#FFF;padding:4px;margin:var(--x);--tok:#123456;--len:16px;border:1px solid red} @media (min-width:640px){.b{width:20rem}}";
  it("선언의 색·길이·var, 커스텀 속성 선언의 값과 at-rule 인자는 제외", () => {
    const o = scanCss(css);
    expect(values(o, "color")).toEqual(["#fff", "red"]);
    expect(values(o, "length")).toEqual(["4px", "1px", "20rem"]);
    expect(values(o, "var")).toEqual(["--x"]);
  });
  it("선언된 커스텀 속성, 문법 오류 파일은 정규식으로", () => {
    expect(declaredCustomProperties(css).sort()).toEqual(["--len", "--tok"]);
    expect(declaredCustomProperties(".a{ --ok: 1; ")).toEqual(["--ok"]);
    expect(() => scanCss(".a{ color: red;; }}}")).toThrow();
  });
  it("CSS 텍스트 조각(태그드 템플릿용)과 클래스 문자열 도우미", () => {
    expect(cssTextOccurrences("color: red; --x: #fff; width: 10px").map((o) => `${o.kind}:${o.value}`)).toEqual(["color:red", "length:10px"]);
    expect(classStringOccurrences("p-4 bg-[#abc]", THEME).map((o) => `${o.kind}:${o.value}`)).toEqual(["palette:p-4", "color:#abc"]);
  });
});

describe("다중집합 차", () => {
  const o = (kind: Occurrence["kind"], value: string): Occurrence => ({ kind, value });
  it("after에만 있는 만큼", () => {
    expect(multisetNew([o("palette", "p-4"), o("palette", "p-4"), o("color", "#000")], [o("palette", "p-4"), o("color", "#fff")])).toEqual([
      o("palette", "p-4"),
      o("color", "#000"),
    ]);
    expect(multisetNew([], [o("palette", "p-4")])).toEqual([]);
  });
});

describe("scoreIndependent", () => {
  const base = { dsModules: DS, resolver: RESOLVER, themeVars: THEME };
  const css = { "design-system/tokens.css": ":root{--space-4:16px;--color-blue-400:#3b82f6}" };
  const added = (file: string, after: string): IndepChange => ({ file, status: "added", before: null, after });

  it("추가 파일: defined/undefined var, 색, 길이, 팔레트, 컴포넌트를 센다 — 손으로 센 값", () => {
    const code = [
      `import { Button } from "./ui/button";`,
      `import { Row } from "./Row";`,
      `export const A = () => (`,
      `  <div className="p-4 text-sm gap-[var(--space-4)] bg-[var(--color-blue-400)]" style={{ margin: "var(--nope)", color: "#fff", padding: "8px" }}>`,
      `    <Button /><Row />`,
      `  </div>`,
      `);`,
    ].join("\n");
    const s = scoreIndependent({ ...base, cssFiles: css, changes: [added("src/components/A.tsx", code)] });
    expect(s.totals).toMatchObject({
      colorLiterals: 1,
      lengthLiterals: 1,
      tailwindPalette: 2,
      varDefined: 2,
      varUndefined: 1,
      dsComponents: 1,
      otherLocalComponents: 1,
      parseFailed: 0,
      files: 1,
    });
    expect(s.undefinedVars).toEqual(["--nope"]);
    // 2 / (2 + 1 + 1 + 1 + 2) = 2/7
    expect(s.indepUsage).toBe(0.2857);
  });

  it("분모 0이면 indepUsage는 null", () => {
    const s = scoreIndependent({ ...base, cssFiles: css, changes: [added("src/a.tsx", `export const A = () => <div className="flex" />;`)] });
    expect(s.indepUsage).toBeNull();
  });

  it("수정 파일: before에 있던 등장은 새로 센 것이 아니다(순서를 바꿔도 0)", () => {
    const before = `export const A = () => <div className="p-4" style={{ color: "#fff" }} />;`;
    const after = `export const A = () => <div style={{ color: "#fff" }} className="p-4" />;`;
    const same = scoreIndependent({ ...base, cssFiles: css, changes: [{ file: "src/a.tsx", status: "modified", before, after }] });
    expect(same.totals).toMatchObject({ colorLiterals: 0, tailwindPalette: 0 });
    const more = `export const A = () => <div className="p-4 p-4" style={{ color: "#fff", background: "#000" }} />;`;
    const diff = scoreIndependent({ ...base, cssFiles: css, changes: [{ file: "src/a.tsx", status: "modified", before, after: more }] });
    expect(diff.totals).toMatchObject({ colorLiterals: 1, tailwindPalette: 1 });
  });

  it("에이전트가 바꾼 CSS: 새 선언을 세고, 거기서 선언한 var는 defined", () => {
    const sheet = ".card{padding:12px;color:var(--brand)} :root{--brand:#123}";
    const s = scoreIndependent({
      ...base,
      cssFiles: { ...css, "src/card.css": sheet },
      changes: [added("src/card.css", sheet)],
    });
    expect(s.totals).toMatchObject({ lengthLiterals: 1, varDefined: 1, varUndefined: 0, colorLiterals: 0 });
  });

  it("제외·무시·삭제·파싱 실패", () => {
    const s = scoreIndependent({
      ...base,
      cssFiles: css,
      changes: [
        added("design-system/components/Badge.tsx", `export const B = () => <i style={{ color: "#fff" }} />;`),
        added(".dsmith/x.ts", "const a = 1;"),
        added("README.md", "# x"),
        { file: "src/old.tsx", status: "deleted", before: "x", after: null },
        added("src/bad.tsx", "const = ;"),
        added("src/ok.tsx", `export const A = () => <i style={{ color: "#fff" }} />;`),
      ],
    });
    expect(s.excluded).toEqual([".dsmith/x.ts", "design-system/components/Badge.tsx"]);
    expect(s.ignored).toEqual(["README.md"]);
    expect(s.files.map((f) => [f.file, f.parseFailed])).toEqual([
      ["src/bad.tsx", true],
      ["src/ok.tsx", false],
    ]);
    expect(s.totals).toMatchObject({ parseFailed: 1, files: 2, colorLiterals: 1 });
  });

  it("before가 파싱되지 않으면 등장 없음으로 본다", () => {
    const s = scoreIndependent({
      ...base,
      cssFiles: css,
      changes: [{ file: "src/a.tsx", status: "modified", before: "const = ;", after: `export const A = () => <i style={{ color: "#fff" }} />;` }],
    });
    expect(s.totals.colorLiterals).toBe(1);
  });

  it("결정적: 변경 순서가 달라도 같은 결과", () => {
    const a = added("src/a.tsx", `export const A = () => <i className="p-4" />;`);
    const b = added("src/b.tsx", `export const B = () => <i className="m-4" />;`);
    expect(scoreIndependent({ ...base, cssFiles: css, changes: [a, b] })).toEqual(scoreIndependent({ ...base, cssFiles: css, changes: [b, a] }));
  });
});

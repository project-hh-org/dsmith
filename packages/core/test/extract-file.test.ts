import type { Extractor, StyleUsage } from "@dsmith-dev/extractor-api";
import { describe, expect, it } from "vitest";
import { extractFileStyles, extractorMatchers } from "../src/index/extract-file.js";

const usage = (file: string): StyleUsage => ({
  file,
  line: 1,
  column: 1,
  property: "color",
  raw: "#fff",
  normalized: { kind: "unknown" },
  source: "hardcoded",
  extractor: "fake",
});

function fake(name: string, files: string[], opts: { applies?: boolean; throws?: boolean } = {}): Extractor {
  return {
    name,
    files,
    parses: "none",
    appliesTo: () => opts.applies ?? true,
    extract: () => {
      if (opts.throws) throw new Error("boom");
      return [usage("elsewhere")];
    },
    write: () => null,
  };
}

describe("extractorMatchers", () => {
  it("dot 기본 false: 점 디렉터리는 안 맞고, dot:true면 맞는다", () => {
    const e = [fake("a", ["**/*.tsx"])];
    expect(extractorMatchers(e)[0]?.matches("src/.hidden/x.tsx")).toBe(false);
    expect(extractorMatchers(e, { dot: true })[0]?.matches("src/.hidden/x.tsx")).toBe(true);
    expect(extractorMatchers(e)[0]?.matches("x.tsx")).toBe(true);
  });
});

describe("extractFileStyles", () => {
  const ctx = { root: "/r", file: "src/x.tsx", code: "" };

  it("glob이 맞고 appliesTo가 참인 Extractor만 실행하고 usage.file을 맞춘다", () => {
    const matchers = extractorMatchers([
      fake("a", ["**/*.tsx"]),
      fake("b", ["**/*.css"]),
      fake("c", ["**/*.tsx"], { applies: false }),
    ]);
    const out = extractFileStyles(ctx, matchers);
    expect(out.extractorsRun).toEqual(["a"]);
    expect(out.styles).toHaveLength(1);
    expect(out.styles[0]?.file).toBe("src/x.tsx");
  });

  it("resolveRef가 토큰을 돌려주면 ref가 있는 usage를 제자리에서 token으로 바꾼다(객체 동일성 유지)", () => {
    const original: StyleUsage = {
      ...usage("src/x.tsx"),
      source: "dynamic",
      property: "other",
      ref: { specifier: "../theme", imported: "typography", path: ["caption"], spread: true },
    };
    const plain: StyleUsage = { ...usage("src/x.tsx"), source: "dynamic" };
    const extractor: Extractor = { ...fake("a", ["**/*.tsx"]), extract: () => [original, plain] };
    const token = {
      name: "typography.caption.fontSize",
      value: "12",
      category: "font-size" as const,
      normalized: { kind: "length" as const, px: 12 },
    };
    const seen: string[] = [];
    const out = extractFileStyles(ctx, extractorMatchers([extractor]), {
      resolveRef: (file, u) => {
        seen.push(`${file}:${u.ref?.path.join(".")}`);
        return token;
      },
    });
    expect(seen).toEqual(["src/x.tsx:caption"]);
    expect(out.styles[0]).toBe(original);
    expect(original).toMatchObject({ source: "token", property: "font-size", normalized: { kind: "length", px: 12 } });
    expect(original.ref?.path).toEqual(["caption"]);
    expect(out.styles[1]?.source).toBe("dynamic");
  });

  it("resolveRef가 null이면 usage를 그대로 둔다", () => {
    const original: StyleUsage = { ...usage("src/x.tsx"), source: "dynamic", ref: { specifier: "./t", imported: "c", path: ["a"] } };
    const extractor: Extractor = { ...fake("a", ["**/*.tsx"]), extract: () => [original] };
    extractFileStyles(ctx, extractorMatchers([extractor]), { resolveRef: () => null });
    expect(original.source).toBe("dynamic");
  });

  it("Extractor 예외는 parse(<name>): <msg>로 다시 던진다", () => {
    const matchers = extractorMatchers([fake("a", ["**/*.tsx"]), fake("bad", ["**/*.tsx"], { throws: true })]);
    expect(() => extractFileStyles(ctx, matchers)).toThrow("parse(bad): boom");
  });
});

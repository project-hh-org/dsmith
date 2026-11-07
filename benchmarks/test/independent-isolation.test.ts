import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/independent");
const sources = fs.readdirSync(dir).filter((f) => f.endsWith(".ts"));

/** 주석을 뺀 소스(주석 안의 예시 코드는 import가 아니다) */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

/** import/export-from/require/동적 import의 모듈 지정자 */
function specifiers(code: string): string[] {
  const out: string[] = [];
  for (const m of stripComments(code).matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)["']([^"']+)["']/gm)) out.push(m[1] ?? "");
  return out;
}

const ALLOWED_PACKAGES = new Set(["typescript", "postcss", "@babel/parser"]);

describe("독립 채점기는 dsmith 코드를 import하지 않는다", () => {
  it("src/independent에 소스가 있다", () => {
    expect(sources.length).toBeGreaterThan(5);
  });

  it.each(sources)("%s의 모든 import 지정자는 같은 폴더 파일·node: 내장·허용 패키지뿐", (file) => {
    const code = fs.readFileSync(path.join(dir, file), "utf-8");
    for (const spec of specifiers(code)) {
      const ok = /^\.\/[\w-]+\.js$/.test(spec) || spec.startsWith("node:") || ALLOWED_PACKAGES.has(spec);
      expect(ok, `${file}: 허용되지 않는 import "${spec}"`).toBe(true);
      expect(spec).not.toMatch(/dsmith/i);
      expect(spec).not.toMatch(/^\.\.\//);
    }
  });

  it("검사기 자체 확인: 금지된 import를 실제로 잡는다", () => {
    expect(specifiers(`import { x } from "@dsmith-dev/core";\nexport * from "../score.js";\nconst y = await import("dsmith");\nconst z = require("@dsmith-dev/guard");`)).toEqual([
      "@dsmith-dev/core",
      "../score.js",
      "dsmith",
      "@dsmith-dev/guard",
    ]);
    expect(specifiers(`// import a from "@dsmith-dev/core"\n/* import b from "../x.js" */`)).toEqual([]);
  });

  it("코드(주석 제외)에 @dsmith-dev 문자열이 없다", () => {
    for (const file of sources) expect(stripComments(fs.readFileSync(path.join(dir, file), "utf-8")), file).not.toMatch(/@dsmith-dev|packages\/(?:core|guard|cli)/);
  });

  it("같은 폴더 import는 실제로 있는 파일이다", () => {
    for (const file of sources) {
      for (const spec of specifiers(fs.readFileSync(path.join(dir, file), "utf-8"))) {
        if (spec.startsWith("./")) expect(fs.existsSync(path.join(dir, spec.replace(/\.js$/, ".ts"))), `${file} → ${spec}`).toBe(true);
      }
    }
  });

  it("require·동적 import로 우회하지 않는다", () => {
    for (const file of sources) {
      const code = stripComments(fs.readFileSync(path.join(dir, file), "utf-8"));
      expect(code, file).not.toMatch(/\brequire\s*\(/);
      expect(code, file).not.toMatch(/\bimport\s*\(\s*[^"'\s]/);
    }
  });

  it("package.json 의존성에 허용 패키지가 선언돼 있다", () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(dir, "../../package.json"), "utf-8")) as { dependencies: Record<string, string> };
    for (const name of ALLOWED_PACKAGES) expect(pkg.dependencies[name], name).toBeDefined();
  });
});

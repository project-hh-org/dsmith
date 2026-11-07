import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { evaluateIndependent, readCssFiles, readDsModules, readResolverConfig, readThemeVars } from "../src/independent/index.js";

const tmps: string[] = [];
function repo(files: Record<string, string>): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-bench-io-")));
  tmps.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  return dir;
}
afterAll(() => {
  for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
});

const FILES = {
  "tsconfig.json": `{
    // 주석이 있는 tsconfig
    "compilerOptions": { "baseUrl": ".", "jsx": "preserve", "strict": true, "paths": { "@/*": ["./src/*"] } },
  }`,
  "design-system/tokens.css": ":root{--space-4:16px;--color-blue-400:#3b82f6}",
  "design-system/tailwind.preset.ts": `export default { theme: { extend: { spacing: { "ds-4": "var(--space-4)" }, colors: { "ds-blue-400": "var(--color-blue-400)" } } } };`,
  "tailwind.config.ts": `export default { theme: { extend: { colors: { brand: "#3B82F6" } } } };`,
  "src/styles/app.css": ".x{padding:4px}",
  "node_modules/pkg/skip.css": ":root{--hidden:1}",
  ".dsmith/guard.json": JSON.stringify({ ds: { modules: ["src/components/ui", "src/components/ui/button"] } }),
  "src/components/ui/button.tsx": `export function Button() { return <button />; }\n`,
  "src/components/Old.tsx": `export const o = 1;\n`,
};

describe("독립 채점기 입출력 도우미", () => {
  const root = repo(FILES);

  it("css 파일을 모으되 node_modules는 건너뛴다", () => {
    expect(Object.keys(readCssFiles(root)).sort()).toEqual(["design-system/tokens.css", "src/styles/app.css"]);
  });
  it("주석이 있는 tsconfig의 baseUrl·paths를 읽는다", () => {
    expect(readResolverConfig(root)).toEqual({ baseUrl: "", paths: { "@/*": ["./src/*"] } });
    expect(readResolverConfig(repo({}))).toEqual({ baseUrl: "", paths: {} });
  });
  it("프리셋·설정에서 var 테마 키만 읽는다", () => {
    expect([...readThemeVars(root)].sort()).toEqual([
      ["ds-4", "--space-4"],
      ["ds-blue-400", "--color-blue-400"],
    ]);
  });
  it(".dsmith/guard.json의 ds.modules를 일반 JSON으로 읽고, 없으면 []", () => {
    expect(readDsModules(root)).toEqual(["src/components/ui", "src/components/ui/button"]);
    expect(readDsModules(repo({}))).toEqual([]);
  });

  it("evaluateIndependent: 바뀐 파일을 독립 채점하고 타입 검사한다(복사본 상태 기준)", () => {
    const { independent, typeCheck } = evaluateIndependent({
      root,
      changes: [
        {
          file: "src/components/Card.tsx",
          status: "added",
          before: null,
          after: [
            `import { Button } from "./ui/button";`,
            `export const Card = () => (<div className="gap-ds-4 p-4 bg-[var(--color-blue-400)]" style={{ margin: "var(--nope)" }}><Button /></div>);`,
            `export const n: number = "x";`,
          ].join("\n"),
        },
        { file: "src/components/Old.tsx", status: "deleted", before: "x", after: null },
        { file: "src/styles/new.css", status: "added", before: null, after: ".y{color:var(--space-4);margin:var(--local)}:root{--local:1}" },
      ],
    });
    expect(independent.totals).toMatchObject({ varDefined: 4, varUndefined: 1, tailwindPalette: 1, dsComponents: 1, colorLiterals: 0, lengthLiterals: 0 });
    expect(independent.undefinedVars).toEqual(["--nope"]);
    expect(typeCheck.mode).toBe("구문·의미 검사(의존성 타입 없이)");
    expect(typeCheck.filesChecked).toBe(1);
    expect(typeCheck.typeErrors).toBe(1);
  });
});

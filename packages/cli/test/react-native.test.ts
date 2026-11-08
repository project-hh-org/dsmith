import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { readCatalog } from "@dsmith-dev/core";
import { runAiCommand } from "../src/commands/ai.js";
import { runAudit } from "../src/commands/audit.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

function copyFixture(name: string, base: "fixtures" | "examples" = "fixtures"): string {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-cli-rn-")));
  roots.push(root);
  fs.cpSync(path.join(repo, base, name), root, { recursive: true, filter: (p) => !p.split(path.sep).includes(".dsmith") });
  return root;
}

describe("fixtures/rn-app: audit", () => {
  it("RN 방식만 켜지고, JS 테마 직접 참조가 토큰 사용으로 세어져 점수 대상이 생긴다", async () => {
    const root = copyFixture("rn-app");
    const { result, reportPath } = await runAudit(root);
    const { detect, health } = result;

    expect(detect.framework.name).toBe("react-native");
    expect(detect.activeExtractors).toEqual(["react-native-stylesheet"]);
    expect(detect.ds.kind).toBe("local");
    expect(detect.ds.entry).toBe("src/components/ui.tsx");
    expect(detect.ds.jsThemes?.map((t) => t.file)).toEqual(["src/theme.ts"]);

    expect(health.rated).toBeGreaterThan(0);
    expect(health.dsImportShare).toBeGreaterThan(0);
    expect(result.jsThemeRefs).toBeGreaterThan(0);

    const index = JSON.parse(fs.readFileSync(path.join(root, ".dsmith", "index.json"), "utf-8")) as {
      styles: { file: string; property: string; source: string; ref?: { imported: string; path: string[]; spread?: true } }[];
    };
    const tokenRefs = index.styles.filter((u) => u.source === "token");
    expect(tokenRefs.length).toBe(result.jsThemeRefs);
    // 직접 참조(colors.surface)와 스프레드(...typography.body → font-size)
    expect(tokenRefs.some((u) => u.ref?.imported === "colors" && u.ref.path[0] === "surface")).toBe(true);
    expect(tokenRefs.some((u) => u.ref?.spread === true && u.property === "font-size")).toBe(true);
    // 계산 접근(colors.mode[mode])은 해석하지 않는다
    const modeColor = index.styles.find((u) => u.file === "app/profile.tsx" && u.property === "color" && u.source === "dynamic");
    expect(modeColor).toBeDefined();
    expect(tokenRefs.some((u) => u.file === "app/profile.tsx" && u.property === "color")).toBe(false);
    // style={styles.x}는 dynamic other 한 건씩
    expect(index.styles.some((u) => u.source === "dynamic" && u.property === "other")).toBe(true);

    expect(fs.readFileSync(reportPath, "utf-8")).toContain(`- JS 테마 참조: ${result.jsThemeRefs}개 (src/theme.ts)`);
    expect(fs.readFileSync(reportPath, "utf-8")).not.toContain("스타일 데이터 없음");
  });
});

describe("legacy-demo: 웹 레포의 JS 테마", () => {
  it("theme 직접 참조 3건이 token으로 바뀌고 조건식 1건은 dynamic으로 남는다 (rated 187 → 190)", async () => {
    const root = copyFixture("legacy-demo", "examples");
    const { result } = await runAudit(root);
    expect(result.detect.ds.jsThemes?.map((t) => t.file)).toEqual(["src/lib/theme.ts"]);
    expect(result.jsThemeRefs).toBe(3);
    expect(result.health.rated).toBe(190);
    expect(result.health.hardcodedShare).toBeCloseTo(64 / 190, 4);
    expect(result.health.score).toBe(52);
  });
});

describe("fixtures/rn-app: ai", () => {
  it("entry 파일의 PascalCase export만 컴포넌트로 싣고, JS 토큰과 DS 섹션 토큰 줄을 만든다", async () => {
    const root = copyFixture("rn-app");
    await runAudit(root);
    const r = await runAiCommand({ root, version: "0.0.0-test" });
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0]).toMatchObject({ origin: "ds-local", dir: "src/components/ui" });
    const catalog = (await readCatalog(root))!;
    expect(catalog.components.map((c) => c.name).sort()).toEqual(["Button", "Card"]);
    expect(catalog.components.every((c) => c.file === "src/components/ui.tsx")).toBe(true);
    const names = catalog.tokens.map((t) => t.name);
    expect(names).toContain("colors.surface");
    expect(names).toContain("spacing.md");
    expect(names).toContain("typography.body.fontSize");
    expect(catalog.tokens.find((t) => t.name === "colors.surface")?.js).toEqual({ module: "src/theme", export: "colors", path: ["surface"] });

    const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf-8");
    expect(agents).toContain("`src/theme.ts`의 JS 객체 `colors`·`spacing`·`radius`·`typography` — 스타일 값은 이 객체를 import해 참조(예 `colors.<이름>`), hex·숫자 직접 쓰지 않음");
    const section = agents.slice(agents.indexOf("<!-- dsmith:ds:start -->"), agents.indexOf("<!-- dsmith:ds:end -->"));
    expect(section.split("\n").length).toBeLessThanOrEqual(80);
    expect(section).not.toContain("tokens.css");
  });

  it("DS가 none이어도 JS 테마가 있으면 토큰만 있는 카탈로그로 진행한다", async () => {
    const root = copyFixture("rn-app");
    fs.rmSync(path.join(root, "src/components"), { recursive: true });
    for (const f of fs.readdirSync(path.join(root, "app"))) {
      const abs = path.join(root, "app", f);
      fs.writeFileSync(abs, fs.readFileSync(abs, "utf-8").replace(/^import \{[^}]*\} from "@\/components\/ui";\n/m, ""));
    }
    await runAudit(root);
    const r = await runAiCommand({ root, version: "0.0.0-test" });
    expect(r.components).toBe(0);
    expect(r.tokens).toBeGreaterThan(0);
    const catalog = (await readCatalog(root))!;
    expect(catalog.tokens.some((t) => t.js !== undefined)).toBe(true);
  });
});

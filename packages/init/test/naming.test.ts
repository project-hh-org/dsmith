import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readCssVariableTokens, readW3cTokens } from "@dsmith-dev/core";
import { formatInitSummary, runInit, type InitResult } from "../src/run.js";
import { auditFixture, copyFixture, forceStateZero, treeHash } from "./helpers.js";

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

const NOW = new Date(2026, 10, 8, 12);
const run = (root: string, extra: Partial<Parameters<typeof runInit>[0]> = {}): Promise<InitResult> =>
  runInit({ root, version: "0.0.0-test", now: NOW, all: true, ...extra });
const read = (root: string, rel: string): string => fs.readFileSync(path.join(root, rel), "utf-8");
const statuses = (r: InitResult): string[] => r.outcomes.map((o) => o.status);

const PKG_V4 = JSON.stringify({ name: "tw4", dependencies: { next: "^14.2.0", react: "^18.3.0", tailwindcss: "^4.1.0" } });

type Kind = "none" | "v3" | "v4";
async function repo(kind: Kind): Promise<string> {
  const root =
    kind === "none"
      ? copyFixture("examples/legacy-demo")
      : kind === "v3"
        ? copyFixture("fixtures/tailwind-app")
        : copyFixture("fixtures/tailwind-app", { "package.json": PKG_V4, "app/globals.css": '@import "tailwindcss";\n' });
  roots.push(root);
  await auditFixture(root);
  await forceStateZero(root);
  return root;
}

/** index의 길이 값을 모두 +4px 해 토큰 값이 달라지게(일부 토큰은 사라짐) 한다 */
async function changeValues(root: string): Promise<void> {
  const file = path.join(root, ".dsmith/index.json");
  const index = JSON.parse(fs.readFileSync(file, "utf-8")) as { styles: { normalized: { kind: string; px?: number } }[] };
  for (const s of index.styles) {
    if (s.normalized.kind === "length" && typeof s.normalized.px === "number") s.normalized.px += 4;
  }
  fs.writeFileSync(file, JSON.stringify(index));
}

describe("새 init: --ds- 접두", () => {
  for (const kind of ["none", "v3", "v4"] as const) {
    it(`Tailwind ${kind}`, async () => {
      const root = await repo(kind);
      const r = await run(root);
      expect(r.naming).toEqual({ value: "ds", source: "default" });
      const css = read(root, "design-system/tokens.css");
      const decls = [...css.matchAll(/^\s+(--[\w-]+):/gm)].map((m) => m[1] as string);
      expect(decls.length).toBeGreaterThan(0);
      expect(decls.every((d) => d.startsWith("--ds-"))).toBe(true);
      const json = JSON.parse(read(root, "design-system/tokens.json")) as { $extensions: unknown };
      expect(json.$extensions).toEqual({ "dev.dsmith": { cssPrefix: "ds" } });
      expect(readW3cTokens(read(root, "design-system/tokens.json"), "t.json").tokens.map((t) => t.name).sort()).toEqual(
        readCssVariableTokens(css, "tokens.css").map((t) => t.name).sort(),
      );
      expect((JSON.parse(read(root, ".dsmith/init.json")) as { naming: string }).naming).toBe("ds");
      if (kind === "v3") expect(read(root, "design-system/tailwind.preset.ts")).toMatch(/"var\(--ds-/);
      if (kind === "v4") {
        expect(read(root, "design-system/tailwind.theme.css")).toMatch(/--color-ds-[\w-]+: var\(--ds-color-/);
      }
      expect(r.warnings.filter((w) => w.includes("Tailwind 4"))).toEqual([]);
      expect(formatInitSummary(r)).not.toContain("이전 형식");
      const again = await run(root);
      expect(statuses(again).every((s) => s === "unchanged")).toBe(true);
    });
  }
});

describe("재 init: 이전 형식(legacy) 유지", () => {
  /** main(0.3.0) 산출을 흉내: naming legacy로 만든 뒤 init.json의 naming 키를 지운다 */
  async function legacyRepo(kind: Kind): Promise<{ root: string; before: Record<string, string> }> {
    const root = await repo(kind);
    await run(root, { naming: "legacy" });
    const manifest = JSON.parse(read(root, ".dsmith/init.json")) as Record<string, unknown>;
    delete manifest.naming;
    fs.writeFileSync(path.join(root, ".dsmith/init.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const before: Record<string, string> = {};
    for (const f of ["tokens.css", "tokens.json", "tokens.ts"]) before[f] = read(root, `design-system/${f}`);
    return { root, before };
  }

  it("바이트 동일 + naming legacy 기록(v3/없음은 요약 한 줄)", async () => {
    for (const kind of ["none", "v3"] as const) {
      const { root, before } = await legacyRepo(kind);
      expect(before["tokens.css"]).not.toContain("--ds-");
      expect(before["tokens.json"]).not.toContain("cssPrefix");
      const r = await run(root);
      expect(r.naming).toEqual({ value: "legacy", source: "token-files" });
      expect(statuses(r).slice(0, 3)).toEqual(["unchanged", "unchanged", "unchanged"]);
      for (const f of Object.keys(before)) expect(read(root, `design-system/${f}`)).toBe(before[f]);
      expect((JSON.parse(read(root, ".dsmith/init.json")) as { naming: string }).naming).toBe("legacy");
      const text = formatInitSummary(r);
      expect(text).toContain("토큰 이름: 이전 형식(접두 없음)");
      expect(r.warnings.filter((w) => w.includes("Tailwind 4"))).toEqual([]);
      const again = treeHash(root);
      await run(root);
      expect(treeHash(root)).toBe(again);
    }
  });

  it("v4면 경고 1개", async () => {
    const { root } = await legacyRepo("v4");
    const r = await run(root);
    expect(r.warnings.filter((w) => w.includes("Tailwind 4"))).toEqual([
      "Tailwind 4: 토큰 이름이 이전 형식(--color-*·--text-*·--radius-*)이라 Tailwind 4 기본 테마 변수를 가림 — dsmith migrate --rename-prefix로 --ds- 접두로 바꾸세요",
    ]);
    expect(read(root, "design-system/tailwind.theme.css")).toMatch(/--color-ds-[\w-]+: var\(--color-/);
    expect(statuses(r).every((s) => s === "unchanged")).toBe(true);
  });

  it(".dsmith/ 없는 클론(토큰 파일만 커밋된 상태)에서도 legacy 유지", async () => {
    const { root, before } = await legacyRepo("none");
    fs.rmSync(path.join(root, ".dsmith"), { recursive: true, force: true });
    await auditFixture(root);
    await forceStateZero(root);
    const r = await run(root);
    expect(r.naming).toEqual({ value: "legacy", source: "token-files" });
    expect(statuses(r).slice(0, 3)).toEqual(["unchanged", "unchanged", "unchanged"]);
    for (const f of Object.keys(before)) expect(read(root, `design-system/${f}`)).toBe(before[f]);
  });

  it("토큰 파일을 지웠어도 init.json의 naming이 legacy를 기억한다", async () => {
    const { root } = await legacyRepo("none");
    await run(root); // naming legacy를 init.json에 기록
    fs.rmSync(path.join(root, "design-system/tokens.css"));
    fs.rmSync(path.join(root, "design-system/tokens.json"));
    const r = await run(root);
    expect(r.naming).toEqual({ value: "legacy", source: "manifest" });
    expect(read(root, "design-system/tokens.css")).not.toContain("--ds-");
  });

  it("--out을 바꿔도 이전 outDir의 형식이 legacy면 legacy", async () => {
    const { root } = await legacyRepo("none");
    await run(root); // init.json에 naming·outDir 기록
    const r = await run(root, { outDir: "other" });
    expect(r.outDir).toBe("other");
    expect(r.naming.value).toBe("legacy");
    expect(read(root, "other/tokens.css")).not.toContain("--ds-");
  });
});

describe("형식 판정에 쓰지 않는 파일", () => {
  it("사용자 소유 design-system/tokens.css(notice·매니페스트 없음)는 판정에 쓰지 않아 기본 ds", async () => {
    const root = await repo("none");
    fs.mkdirSync(path.join(root, "design-system"), { recursive: true });
    fs.writeFileSync(path.join(root, "design-system/tokens.css"), ":root { --color-brand: #3b82f6; }\n");
    const r = await run(root);
    expect(r.naming).toEqual({ value: "ds", source: "default" });
  });
});

describe("값이 바뀌는 재 init: 적용 기록이 있으면 토큰 묶음 보류", () => {
  function recordApplied(root: string): void {
    fs.mkdirSync(path.join(root, ".dsmith/migrations"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".dsmith/migrations/20261108-120000.json"),
      JSON.stringify({ version: 1, id: "20261108-120000", status: "applied", summary: {}, patches: [] }),
    );
  }

  for (const naming of ["legacy", "ds"] as const) {
    it(`${naming}: 보류 → --force로 덮어씀`, async () => {
      const root = await repo("none"); // legacy-demo = Tailwind v3(config .ts) → tailwind.preset.ts도 만든다
      await run(root, { naming });
      recordApplied(root);
      const oldCss = read(root, "design-system/tokens.css");
      const oldPreset = read(root, "design-system/tailwind.preset.ts");
      await changeValues(root);
      const held = await run(root);
      expect(held.tokenHold).toBe("renamed");
      expect(held.renamedTokens.length).toBeGreaterThan(0);
      expect(held.renamedTokens[0]?.name).toMatch(naming === "ds" ? /^--ds-/ : /^--(?!ds-)/);
      expect(statuses(held).slice(0, 3)).toEqual(["skipped-modified", "skipped-modified", "skipped-modified"]);
      expect(held.outcomes.at(-1)?.status).toBe("skipped-modified");
      expect(read(root, "design-system/tokens.css")).toBe(oldCss);
      expect(read(root, "design-system/tailwind.preset.ts")).toBe(oldPreset);
      expect(held.warnings.join("\n")).toContain("--force");
      expect(formatInitSummary(held)).toContain("--force");

      const forced = await run(root, { force: true });
      expect(forced.tokenHold).toBeNull();
      expect(statuses(forced).slice(0, 3)).toContain("updated");
      expect(read(root, "design-system/tokens.css")).not.toBe(oldCss);
    });
  }

  it("적용 기록이 없으면 쓰고 경고만", async () => {
    const root = await repo("none");
    await run(root);
    await changeValues(root);
    const r = await run(root);
    expect(r.tokenHold).toBeNull();
    expect(r.renamedTokens.length).toBeGreaterThan(0);
    expect(r.warnings.filter((w) => w.startsWith("init 재실행으로 토큰"))).toHaveLength(1);
    expect(statuses(r)).toContain("updated");
  });

  it("접두만 바뀌는 재 init(legacy → ds, naming 명시)은 보류 대상이 아니다", async () => {
    const root = await repo("none");
    await run(root, { naming: "legacy" });
    recordApplied(root);
    const r = await run(root, { naming: "ds" });
    expect(r.tokenHold).toBeNull();
    expect(r.renamedTokens).toEqual([]);
    expect(read(root, "design-system/tokens.css")).toContain("--ds-");
  });
});

describe("guard 스냅샷: legacy 레포는 이름 그대로", () => {
  it("loadReplacementTokens가 legacy 파일의 --color-… 이름을 그대로 돌려준다", async () => {
    const { loadReplacementTokens } = await import("@dsmith-dev/core");
    const root = await repo("none");
    await run(root, { naming: "legacy" });
    const before = await loadReplacementTokens(root, []);
    expect(before.tokens.length).toBeGreaterThan(0);
    expect(before.tokens.every((t) => !t.name.startsWith("--ds-"))).toBe(true);
    await run(root); // 같은 입력 재 init
    const after = await loadReplacementTokens(root, []);
    expect(JSON.stringify(after.tokens)).toBe(JSON.stringify(before.tokens));
  });
});

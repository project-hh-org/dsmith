import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readIndex, type MigrationRecord } from "@dsmith-dev/core";
import { runInit } from "@dsmith-dev/init";
import { runAudit } from "../src/commands/audit.js";
import { runMigrateCommand, type MigrateCommandOptions } from "../src/commands/migrate.js";
import { treeHash } from "./tree-hash.js";

/** `dsmith migrate --rename-prefix`: 이전 형식(--color-*) init 산출 + 코드의 var() 참조 → --ds- 접두 */

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");

const tmps: string[] = [];
const saved: Record<string, string | undefined> = {};
const KEYS = ["HOME", "GIT_CONFIG_NOSYSTEM", "GIT_CONFIG_GLOBAL", "XDG_CONFIG_HOME", "EMAIL", "GIT_AUTHOR_NAME", "GIT_AUTHOR_EMAIL", "GIT_COMMITTER_NAME", "GIT_COMMITTER_EMAIL"];
beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-rename-home-"));
  tmps.push(home);
  process.env.HOME = home;
  process.env.XDG_CONFIG_HOME = path.join(home, ".config");
  process.env.GIT_CONFIG_NOSYSTEM = "1";
  process.env.GIT_CONFIG_GLOBAL = path.join(home, "nope");
  for (const k of ["EMAIL", "GIT_AUTHOR_NAME", "GIT_AUTHOR_EMAIL", "GIT_COMMITTER_NAME", "GIT_COMMITTER_EMAIL"]) delete process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  for (const t of tmps.splice(0)) fs.rmSync(t, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]): string =>
  spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.com", ...args], { cwd, encoding: "utf-8" }).stdout;

const A_CSS = `.a { color: var(--color-blue-400); padding: var( --space-2 , 8px); }\n`;
const B_TSX = `export const B = () => (
  <div style={{ color: "var(--color-blue-400)" }} className="bg-[color:var(--color-blue-400)] p-[var(--space-2)]">
    {(document.body.style.setProperty("--color-blue-400", "red"), null)}
  </div>
);
`;
const C_CSS = `.c { color: var(--color-blue-400-2); margin: var(--other); }\n`;
const SOURCES: Record<string, string> = { "src/rn/a.css": A_CSS, "src/rn/b.tsx": B_TSX, "src/rn/c.css": C_CSS };

/** legacy-demo 복사 → audit → 이전 형식으로 init → 참조가 든 소스 추가 → audit */
async function legacyRepo(extra: Record<string, string> = SOURCES): Promise<string> {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-rename-")));
  tmps.push(root);
  fs.cpSync(path.join(repoRoot, "examples/legacy-demo"), root, { recursive: true, filter: (p) => !p.split(path.sep).includes(".dsmith") });
  await runAudit(root);
  await runInit({ root, version: "0.0.0-test", all: true, naming: "legacy" });
  for (const [file, content] of Object.entries(extra)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  await runAudit(root);
  return root;
}

const read = (root: string, rel: string): string => fs.readFileSync(path.join(root, rel), "utf-8");
const rename = (root: string, opts: Partial<MigrateCommandOptions> = {}) => runMigrateCommand({ root, renamePrefix: true, ...opts });
const tokenUsages = async (root: string): Promise<number> => (await readIndex(root))!.styles.filter((s) => s.source === "token").length;

interface RenameJson {
  plan: { renames: unknown[]; files: { file: string; refs: number }[]; mentions: { file: string; name: string }[] };
  applied: { id: string; files: { file: string; status: string }[] } | null;
  leftover?: { file: string }[];
  score?: { before: number; after: number };
}

describe("migrate --rename-prefix 계획", { timeout: 60_000 }, () => {
  it("참조·파일·var() 밖 언급 수를 세고 아무것도 쓰지 않는다(.dsmith 포함)", async () => {
    const root = await legacyRepo();
    const before = treeHash(root, { includeDsmith: true });
    const out = await rename(root);
    const json = out.json as RenameJson;
    expect(json.applied).toBeNull();
    expect(json.plan.files.find((f) => f.file === "src/rn/a.css")?.refs).toBe(2);
    expect(json.plan.files.find((f) => f.file === "src/rn/b.tsx")?.refs).toBe(3);
    expect(json.plan.files.some((f) => f.file === "src/rn/c.css")).toBe(false);
    expect(json.plan.files.some((f) => f.file.startsWith("design-system/"))).toBe(false);
    expect(json.plan.mentions).toEqual([expect.objectContaining({ file: "src/rn/b.tsx", name: "--color-blue-400" })]);
    expect(out.text).toMatch(/^토큰 이름 바꾸기: \d+개 · 참조 \d+개 · 파일 \d+개 · var\(\) 밖 언급 1개\(바꾸지 않음\)/);
    expect(treeHash(root, { includeDsmith: true })).toBe(before);
  });

  it("다른 범위 옵션과 함께 쓰면 오류", async () => {
    const root = await legacyRepo();
    await expect(rename(root, { category: "color", close: true })).rejects.toThrow("--rename-prefix는 --category, --close와 함께 쓸 수 없습니다");
    await expect(rename(root, { only: "tokens" })).rejects.toThrow("--only와 함께");
    await expect(rename(root, { revert: "x" })).rejects.toThrow("--revert");
  });
});

describe("migrate --rename-prefix --apply", { timeout: 60_000 }, () => {
  it("참조와 토큰 파일을 함께 바꾸고(기록 kind rename-prefix), 토큰 사용 수는 그대로이며, --revert가 트리를 원래대로 돌린다", async () => {
    const root = await legacyRepo();
    const treeBefore = treeHash(root);
    const usedBefore = await tokenUsages(root);
    const out = await rename(root, { apply: true });
    expect(out.exitCode).toBe(0);
    const json = out.json as RenameJson;
    expect(json.leftover).toEqual([]);

    expect(read(root, "src/rn/a.css")).toBe(`.a { color: var(--ds-color-blue-400); padding: var( --ds-space-2 , 8px); }\n`);
    expect(read(root, "src/rn/b.tsx")).toContain('"var(--ds-color-blue-400)"');
    expect(read(root, "src/rn/b.tsx")).toContain("bg-[color:var(--ds-color-blue-400)] p-[var(--ds-space-2)]");
    expect(read(root, "src/rn/b.tsx")).toContain('setProperty("--color-blue-400"');
    expect(read(root, "src/rn/c.css")).toBe(C_CSS);
    for (const f of ["tokens.css", "tailwind.preset.ts"]) expect(read(root, `design-system/${f}`)).toContain("--ds-");
    expect(read(root, "design-system/tokens.css")).not.toMatch(/--(?!ds-)[a-z]+-[a-z0-9-]+:/);
    expect(JSON.parse(read(root, "design-system/tokens.json"))).toMatchObject({ $extensions: { "dev.dsmith": { cssPrefix: "ds" } } });
    expect((JSON.parse(read(root, ".dsmith/init.json")) as { naming: string }).naming).toBe("ds");
    const id = json.applied!.id;
    const record = JSON.parse(read(root, `.dsmith/migrations/${id}.json`)) as MigrationRecord;
    expect(record).toMatchObject({ kind: "rename-prefix", status: "applied" });
    expect(await tokenUsages(root)).toBe(usedBefore);
    expect(json.score!.after).toBe(json.score!.before);

    const reverted = await runMigrateCommand({ root, revert: id });
    expect(reverted.exitCode).toBeUndefined();
    expect(treeHash(root)).toBe(treeBefore);
    expect((JSON.parse(read(root, ".dsmith/init.json")) as { naming: string }).naming).toBe("legacy");
    expect(await tokenUsages(root)).toBe(usedBefore);
  });

  it("이미 --ds- 형식이면 아무것도 쓰지 않고 종료 0", async () => {
    const root = await legacyRepo();
    await rename(root, { apply: true });
    const before = treeHash(root, { includeDsmith: true });
    for (const apply of [false, true]) {
      const out = await rename(root, { apply });
      expect(out.text).toContain("이미 --ds- 접두 형식");
      expect(out.exitCode).toBeUndefined();
    }
    expect(treeHash(root, { includeDsmith: true })).toBe(before);
  });

  it("토큰 파일이 사용자 수정으로 보류되면 아무것도 쓰지 않고 오류", async () => {
    const root = await legacyRepo();
    fs.appendFileSync(path.join(root, "design-system/tokens.css"), "/* mine */\n");
    const before = treeHash(root, { includeDsmith: true });
    await expect(rename(root, { apply: true })).rejects.toThrow("토큰 파일이 보류돼 이름을 바꿀 수 없음");
    expect(treeHash(root, { includeDsmith: true })).toBe(before);
  });

  it("쓰지 못한 파일이 있으면 옛 참조가 남은 곳을 알리고 종료 1", async () => {
    const root = await legacyRepo();
    // UTF-8이 아닌 바이트가 섞인 파일은 해시 비교 쓰기가 거부한다
    fs.mkdirSync(path.join(root, "src/rn2"), { recursive: true });
    fs.writeFileSync(path.join(root, "src/rn2/latin.css"), Buffer.concat([Buffer.from(A_CSS), Buffer.from([0xff, 0x0a])]));
    const out = await rename(root, { apply: true });
    expect(out.exitCode).toBe(1);
    const json = out.json as RenameJson;
    expect(json.leftover!.length).toBeGreaterThan(0);
    expect(out.text).toContain("src/rn2/latin.css");
    expect(out.text).toContain("옛 이름의 var() 참조가");
    expect(json.applied!.files.find((f) => f.file === "src/rn2/latin.css")?.status).not.toBe("applied");
  });

  it("migrate 적용(var() 참조) 뒤에도 값이 바뀌지 않고, 되돌리면 바이트 동일", async () => {
    const root = await legacyRepo({});
    const first = await runMigrateCommand({ root, apply: true });
    expect(first.exitCode).toBe(0);
    const treeBefore = treeHash(root);
    const usedBefore = await tokenUsages(root);
    expect(usedBefore).toBeGreaterThan(0);
    const out = await rename(root, { apply: true });
    expect(out.exitCode).toBe(0);
    expect((out.json as RenameJson).plan.files.length).toBeGreaterThan(0);
    expect(await tokenUsages(root)).toBe(usedBefore);
    await runMigrateCommand({ root, revert: (out.json as RenameJson).applied!.id });
    expect(treeHash(root)).toBe(treeBefore);
  });

  it("revert: 적용 뒤 참조를 고친 파일이 있으면 토큰 파일은 되돌리지 않고 종료 1", async () => {
    const root = await legacyRepo();
    const out = await rename(root, { apply: true });
    fs.appendFileSync(path.join(root, "src/rn/a.css"), "/* edited */\n");
    const reverted = await runMigrateCommand({ root, revert: (out.json as RenameJson).applied!.id });
    expect(reverted.exitCode).toBe(1);
    expect(reverted.text).toContain("토큰 파일을 이전 형식으로 되돌리지 않음");
    expect(read(root, "design-system/tokens.css")).toContain("--ds-");
  });
});

describe("migrate --rename-prefix --apply --branch", { timeout: 60_000 }, () => {
  function gitInit(root: string): void {
    fs.writeFileSync(path.join(root, ".gitignore"), ".dsmith/\n");
    git(root, "init", "-q", "-b", "main");
    git(root, "add", ".");
    git(root, "commit", "-q", "-m", "init");
    git(root, "config", "user.name", "Repo Author");
    git(root, "config", "user.email", "repo@example.com");
  }

  it("브랜치에 커밋 1개(소스 + 토큰·프리셋 파일, .dsmith 제외)", async () => {
    const root = await legacyRepo();
    gitInit(root);
    const out = await rename(root, { apply: true, branch: "ds/rename-prefix" });
    expect(out.exitCode).toBe(0);
    expect(git(root, "branch", "--show-current").trim()).toBe("ds/rename-prefix");
    expect(git(root, "rev-list", "--count", "main..HEAD").trim()).toBe("1");
    expect(git(root, "log", "-1", "--format=%s").trim()).toBe("refactor: 토큰 CSS 변수에 --ds- 접두 (dsmith migrate --rename-prefix)");
    const files = git(root, "show", "--name-only", "--format=", "HEAD").split("\n").filter((l) => l !== "");
    expect(files).toEqual(expect.arrayContaining(["src/rn/a.css", "src/rn/b.tsx", "design-system/tokens.css", "design-system/tokens.json", "design-system/tailwind.preset.ts"]));
    expect(files.some((f) => f.startsWith(".dsmith/"))).toBe(false);
    expect(git(root, "status", "--porcelain").trim()).toBe("");
  });

  it("커밋되지 않은 토큰 파일은 --with-tokens 없이는 쓰기 전에 오류, --with-tokens면 함께 커밋", async () => {
    const root = await legacyRepo();
    gitInit(root);
    git(root, "rm", "-r", "-q", "--cached", "design-system");
    git(root, "commit", "-q", "-m", "토큰 파일은 아직 커밋하지 않음");
    const before = treeHash(root, { includeDsmith: true });
    await expect(rename(root, { apply: true, branch: "ds/need-tokens" })).rejects.toThrow(/--branch를 쓸 수 없음: 토큰 파일이 브랜치에 없음/);
    expect(treeHash(root, { includeDsmith: true })).toBe(before);
    expect(git(root, "branch", "--list", "ds/need-tokens").trim()).toBe("");

    const ok = await rename(root, { apply: true, branch: "ds/with-tokens", withTokens: true });
    expect(ok.exitCode).toBe(0);
    const files = git(root, "show", "--name-only", "--format=", "HEAD").split("\n");
    expect(files).toEqual(expect.arrayContaining(["design-system/tokens.css", "design-system/tokens.json", "src/rn/a.css"]));
  });
});

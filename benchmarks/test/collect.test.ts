import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Base } from "../src/base.js";
import { assertReplayDir, collectChanges, readReplay, readReplaySource, writeOutputs, writeReplayMeta } from "../src/collect.js";
import { scoreRun } from "../src/score.js";
import { cleanupTmps, git, tmpDir } from "./helpers.js";

afterAll(cleanupTmps);

const write = (root: string, file: string, content: string | Buffer): void => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), content);
};

function repo(): string {
  const root = tmpDir("dsmith-bench-collect-");
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "t");
  git(root, "config", "user.email", "t@t.invalid");
  write(root, "keep.ts", "export const keep = 1;\n");
  write(root, "edit.tsx", "export const a = 1;\n");
  write(root, "gone.ts", "export const gone = 1;\n");
  write(root, "old-name.ts", "export const renamed = 1;\n");
  write(root, ".gitignore", "ignored/\n");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "base");
  return root;
}

describe("collectChanges", () => {
  let root: string;
  beforeAll(() => {
    root = repo();
    write(root, "edit.tsx", "export const a = 2;\n");
    fs.rmSync(path.join(root, "gone.ts"));
    git(root, "mv", "old-name.ts", "new-name.ts");
    write(root, "src/components/Added.tsx", "export const Added = 1;\n");
    write(root, "ignored/skip.ts", "x\n");
    write(root, "logo.png", Buffer.from([0x89, 0x50, 0x00, 0x47]));
    write(root, "big.ts", "x".repeat(1024 * 1024 + 1));
  });

  it("추가·수정·삭제·이름 변경·바이너리를 분류하고 before/after를 채운다", async () => {
    const changes = await collectChanges(root);
    const byFile = new Map(changes.map((c) => [c.file, c]));
    expect(changes.map((c) => c.file)).toEqual(["big.ts", "edit.tsx", "gone.ts", "logo.png", "new-name.ts", "old-name.ts", "src/components/Added.tsx"]);

    expect(byFile.get("src/components/Added.tsx")).toEqual({ file: "src/components/Added.tsx", status: "added", before: null, after: "export const Added = 1;\n" });
    expect(byFile.get("edit.tsx")).toEqual({ file: "edit.tsx", status: "modified", before: "export const a = 1;\n", after: "export const a = 2;\n" });
    expect(byFile.get("gone.ts")).toEqual({ file: "gone.ts", status: "deleted", before: "export const gone = 1;\n", after: null });
    // 이름 변경 = 새 경로 added + 옛 경로 deleted
    expect(byFile.get("new-name.ts")).toMatchObject({ status: "added", before: null, after: "export const renamed = 1;\n" });
    expect(byFile.get("old-name.ts")).toMatchObject({ status: "deleted", before: "export const renamed = 1;\n", after: null });
    // 바이너리·1MB 초과는 after null(채점에서 ignored)
    expect(byFile.get("logo.png")).toMatchObject({ status: "added", after: null });
    expect(byFile.get("big.ts")).toMatchObject({ status: "added", after: null });
  });

  it(".gitignore 대상과 변경 없는 파일은 나오지 않는다", async () => {
    const files = (await collectChanges(root)).map((c) => c.file);
    expect(files).not.toContain("ignored/skip.ts");
    expect(files).not.toContain("keep.ts");
  });

  it("after: null 인 파일은 scoreRun에서 ignored", async () => {
    // 스냅샷 없이도 되도록 읽지 못한 파일·삭제만 넘긴다(분류는 파일 내용을 보기 전에 끝난다)
    const changes = (await collectChanges(root)).filter((c) => ["big.ts", "logo.png", "gone.ts", "old-name.ts"].includes(c.file));
    const score = scoreRun({ root, snapshot: { exclude: [] } as never, matchers: [], changes, expectedFile: "big.ts" });
    expect(score.ignored).toEqual(["big.ts", "logo.png"]);
    expect(score.deleted).toEqual(["gone.ts", "old-name.ts"]);
    expect(score.files).toEqual([]);
  });

  it("변경이 없으면 빈 목록", async () => {
    expect(await collectChanges(repo())).toEqual([]);
  });
});

describe("writeOutputs / readReplay", () => {
  it("replay 배치로 쓰고 같은 변경으로 읽는다(base의 같은 경로가 before)", async () => {
    const baseDir = tmpDir("dsmith-bench-base-fake-");
    write(baseDir, "src/old.ts", "export const old = 1;\n");
    write(baseDir, "src/gone.ts", "export const gone = 1;\n");
    const base = { dir: baseDir } as Base;
    const out = tmpDir("dsmith-bench-out-");
    await writeOutputs(
      out,
      "dsmith",
      "06-badge",
      1,
      [
        { file: "src/components/New.tsx", status: "added", before: null, after: "export const N = 1;\n" },
        { file: "src/old.ts", status: "modified", before: "export const old = 1;\n", after: "export const old = 2;\n" },
        { file: "src/gone.ts", status: "deleted", before: "export const gone = 1;\n", after: null },
        { file: "logo.png", status: "added", before: null, after: null },
      ],
      { status: "agent-error", exitCode: 3, durationMs: 1234, agentMeta: { costUsd: 0.5, turns: 2 }, harnessPathSeen: true },
    );
    expect(fs.existsSync(path.join(out, "dsmith/06-badge/1/files/src/components/New.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(out, "dsmith/06-badge/1/files/logo.png"))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(out, "dsmith/06-badge/1/run.json"), "utf-8"))).toEqual({
      status: "agent-error",
      exitCode: 3,
      durationMs: 1234,
      agentMeta: { costUsd: 0.5, turns: 2 },
      harnessPathSeen: true,
      deleted: ["src/gone.ts"],
    });

    const r = await readReplay(out, base, "dsmith", "06-badge", 1);
    expect(r.changes).toEqual([
      { file: "src/components/New.tsx", status: "added", before: null, after: "export const N = 1;\n" },
      { file: "src/gone.ts", status: "deleted", before: "export const gone = 1;\n", after: null },
      { file: "src/old.ts", status: "modified", before: "export const old = 1;\n", after: "export const old = 2;\n" },
    ]);
    expect(r.run).toEqual({ status: "agent-error", exitCode: 3, durationMs: 1234, agentMeta: { costUsd: 0.5, turns: 2 }, harnessPathSeen: true });
  });

  it("run.json이 없으면 status replay, 실행 디렉터리가 없으면 missing", async () => {
    const baseDir = tmpDir("dsmith-bench-base-fake-");
    const base = { dir: baseDir } as Base;
    const out = tmpDir("dsmith-bench-out-");
    write(out, "baseline/01-form/1/files/src/components/X.tsx", "export const X = 1;\n");
    const r = await readReplay(out, base, "baseline", "01-form", 1);
    expect(r.run).toEqual({ status: "replay", exitCode: null, durationMs: null, agentMeta: null, harnessPathSeen: false });
    expect(r.changes).toHaveLength(1);

    const missing = await readReplay(out, base, "baseline", "01-form", 2);
    expect(missing.run.status).toBe("missing");
    expect(missing.changes).toEqual([]);
  });

  it("같은 실행에 다시 쓰면 이전 파일이 남지 않는다", async () => {
    const out = tmpDir("dsmith-bench-out-");
    const run = { status: "ok", exitCode: 0, durationMs: 1, agentMeta: null, harnessPathSeen: false } as const;
    await writeOutputs(out, "baseline", "01-form", 1, [{ file: "a.ts", status: "added", before: null, after: "1" }], run);
    await writeOutputs(out, "baseline", "01-form", 1, [{ file: "b.ts", status: "added", before: null, after: "2" }], run);
    expect(fs.existsSync(path.join(out, "baseline/01-form/1/files/a.ts"))).toBe(false);
    expect(fs.existsSync(path.join(out, "baseline/01-form/1/files/b.ts"))).toBe(true);
  });
});

describe("replay 루트 검사 · meta.json", () => {
  it("없는 디렉터리·파일·조건 디렉터리 없는 폴더는 Error, 조건 디렉터리가 하나라도 있으면 통과", async () => {
    const missing = path.join(tmpDir("dsmith-bench-rr-"), "nope");
    await expect(assertReplayDir(missing, ["baseline", "dsmith"])).rejects.toThrow(/replay 디렉터리가 없습니다/);

    const file = tmpDir("dsmith-bench-rr-");
    write(file, "f.txt", "x");
    await expect(assertReplayDir(path.join(file, "f.txt"), ["baseline"])).rejects.toThrow(/디렉터리가 아닙니다/);

    const empty = tmpDir("dsmith-bench-rr-");
    write(empty, "meta.json", "{}");
    await expect(assertReplayDir(empty, ["baseline", "dsmith"])).rejects.toThrow(/조건 디렉터리\(baseline, dsmith\)가 하나도 없습니다/);

    const ok = tmpDir("dsmith-bench-rr-");
    fs.mkdirSync(path.join(ok, "dsmith"));
    await expect(assertReplayDir(ok, ["baseline", "dsmith"])).resolves.toBeUndefined();
    await expect(assertReplayDir(ok, ["baseline"])).rejects.toThrow(/조건 디렉터리/);
  });

  it("meta.json의 source를 읽는다 — 없거나 깨졌거나 모르는 값이면 unknown", async () => {
    const dir = tmpDir("dsmith-bench-meta-");
    expect(await readReplaySource(dir)).toBe("unknown");
    await writeReplayMeta(dir, { source: "agent", repo: "legacy-demo", date: "2026-11-01", agentVersion: "2.1.318" });
    expect(await readReplaySource(dir)).toBe("agent");
    expect(JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf-8"))).toEqual({ version: 1, source: "agent", repo: "legacy-demo", date: "2026-11-01", agentVersion: "2.1.318" });
    write(dir, "meta.json", "{broken");
    expect(await readReplaySource(dir)).toBe("unknown");
    write(dir, "meta.json", JSON.stringify({ source: "magic" }));
    expect(await readReplaySource(dir)).toBe("unknown");
    write(dir, "meta.json", JSON.stringify({ source: "synthetic" }));
    expect(await readReplaySource(dir)).toBe("synthetic");
  });

  it("run.json의 harness-error 상태도 읽는다", async () => {
    const out = tmpDir("dsmith-bench-out-");
    write(out, "baseline/01-form/1/run.json", JSON.stringify({ status: "harness-error", exitCode: null }));
    const r = await readReplay(out, { dir: tmpDir("dsmith-bench-base-fake-") } as Base, "baseline", "01-form", 1);
    expect(r.run.status).toBe("harness-error");
  });
});

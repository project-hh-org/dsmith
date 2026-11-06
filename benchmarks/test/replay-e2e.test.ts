import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLI_BIN, MONOREPO_ROOT } from "../src/base.js";
import { renderReport, reportFromFile } from "../src/report.js";
import type { BenchResult } from "../src/model.js";
import { mdPathOf, parseBenchArgs, planBench, runBench, summaryLines, type BenchArgs } from "../src/run.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const FAKE = path.join(here, "fixtures/fake-agent.mjs");
const REPLAY = path.join(MONOREPO_ROOT, "benchmarks/replay/legacy-demo");
const PROMPTS = ["01-form", "06-badge", "12-pagination"];

const args = (argv: string[]): BenchArgs => parseBenchArgs(argv);

describe("replay (합성 산출물, 네트워크·에이전트 없음)", () => {
  it("3프롬프트 × 2조건 → 실행 6개, 숫자 고정, 두 번 실행해도 JSON 동일", async () => {
    const a = args(["--replay", REPLAY, "--prompts", PROMPTS.join(","), "--date", "2026-11-01"]);
    const r1 = await runBench(a);
    const r2 = await runBench(a);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));

    expect(r1).toMatchObject({ version: 1, date: "2026-11-01", startedAt: null, repo: "legacy-demo", mode: "replay", repeat: 1, timeoutSec: null, conditions: ["baseline", "dsmith"] });
    expect(r1.agent).toEqual({ command: null, version: null, installTool: null, models: [] });
    expect(r1.base).toMatchObject({ tokens: 14, dsComponents: 6 });
    expect(r1.base.snapshotSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r1.prompts.map((p) => p.id)).toEqual(PROMPTS);

    expect(r1.runs).toHaveLength(6);
    expect(r1.runs.map((r) => `${r.prompt}/${r.condition}/${r.rep}/${r.status}`)).toEqual([
      "01-form/baseline/1/replay",
      "01-form/dsmith/1/replay",
      "06-badge/baseline/1/replay",
      "06-badge/dsmith/1/replay",
      "12-pagination/baseline/1/replay",
      "12-pagination/dsmith/1/replay",
    ]);
    expect(r1.runs.every((r) => r.score.expectedFile)).toBe(true);

    const base = r1.aggregate.baseline!;
    const ds = r1.aggregate.dsmith!;
    expect(base).toEqual({
      runs: 3, okRuns: 3, failedRuns: 0, missingExpected: 0, harnessPathSeen: 0,
      token: 1, knownToken: 0, hardcoded: 4, replaceable: 2, tailwindDefault: 46, dynamic: 1,
      nonDs: 1, deprecated: 0, dsComponentUses: 0, parseFailed: 0, files: 3,
      compliance: 0.2, tokenShareAll: 0.0196, costUsd: null, turns: null, mcpToolCalls: null, permissionDenials: null,
    });
    expect(ds).toEqual({
      runs: 3, okRuns: 3, failedRuns: 0, missingExpected: 0, harnessPathSeen: 0,
      token: 20, knownToken: 19, hardcoded: 1, replaceable: 1, tailwindDefault: 0, dynamic: 1,
      nonDs: 0, deprecated: 0, dsComponentUses: 4, parseFailed: 0, files: 3,
      compliance: 0.9524, tokenShareAll: 0.9524, costUsd: null, turns: null, mcpToolCalls: null, permissionDenials: null,
    });
    expect(r1).toMatchObject({ status: "complete", abortReason: null, replaySource: "synthetic" });
    // 불변식
    expect(base.compliance!).toBeLessThan(ds.compliance!);
    expect(ds.token - ds.knownToken).toBe(1); // 지어낸 var(--color-brand) 하나
    expect(base.nonDs).toBeGreaterThanOrEqual(1);
  }, 60_000);

  it("없는 프롬프트 디렉터리는 status missing, 기대 파일 없음으로 센다", async () => {
    const r = await runBench(args(["--replay", REPLAY, "--prompts", "02-modal", "--conditions", "dsmith", "--date", "2026-11-01"]));
    expect(r.runs).toHaveLength(1);
    expect(r.runs[0]).toMatchObject({ prompt: "02-modal", status: "missing" });
    expect(r.aggregate.dsmith).toMatchObject({ runs: 1, okRuns: 0, failedRuns: 1, missingExpected: 1, token: 0, compliance: null });
  }, 60_000);

  it("replay 디렉터리가 없거나 조건 디렉터리가 없으면 Error(missing으로 뭉개지 않는다)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-bench-e2e-rr-"));
    try {
      await expect(runBench(args(["--replay", path.join(dir, "nope"), "--prompts", "06-badge", "--date", "2026-11-01"]))).rejects.toThrow(/replay 디렉터리가 없습니다/);
      await expect(runBench(args(["--replay", dir, "--prompts", "06-badge", "--date", "2026-11-01"]))).rejects.toThrow(/조건 디렉터리/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("CLI: 없는 replay 경로는 종료 코드 2와 메시지", () => {
    const cli = path.join(MONOREPO_ROOT, "benchmarks/dist/run.js");
    const r = spawnSync(process.execPath, [cli, "--replay", "definitely/not/here", "--prompts", "06-badge"], { cwd: os.tmpdir(), encoding: "utf-8" });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("replay 디렉터리가 없습니다");
    expect(r.stdout).toBe("");
  }, 60_000);

  it("CLI: pnpm 인자 모양(`-- --`, `--` 없음)과 --replay-set, 상대 경로(INIT_CWD)가 모두 같은 결과", () => {
    const cli = path.join(MONOREPO_ROOT, "benchmarks/dist/run.js");
    const common = ["--repo", "legacy-demo", "--prompts", "06-badge", "--date", "2026-11-01"];
    const run = (argv: string[], env: Record<string, string> = {}) =>
      spawnSync(process.execPath, [cli, ...argv], { cwd: os.tmpdir(), encoding: "utf-8", env: { ...process.env, ...env } });
    const set = run(["--", "--", ...common, "--replay-set", "legacy-demo"]);
    const plain = run([...common, "--replay-set", "legacy-demo"]);
    const rel = run([...common, "--replay", "benchmarks/replay/legacy-demo"], { INIT_CWD: MONOREPO_ROOT });
    expect(set.status).toBe(0);
    expect(plain.stdout).toBe(set.stdout);
    expect(rel.status).toBe(0);
    expect(rel.stdout).toBe(set.stdout);
    // 같은 repo인데 INIT_CWD가 다르면 상대 경로가 달라져 실패한다(= INIT_CWD를 실제로 쓴다)
    expect(run([...common, "--replay", "benchmarks/replay/legacy-demo"], { INIT_CWD: os.tmpdir() }).status).toBe(2);
  }, 60_000);

  it("알 수 없는 프롬프트 id는 Error", async () => {
    await expect(runBench(args(["--replay", REPLAY, "--prompts", "99-nope"]))).rejects.toThrow(/알 수 없는 프롬프트 id/);
  });

  it("--out을 주면 결과 JSON을 쓰고, 요약 줄은 조건별 준수율을 담는다", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-bench-e2e-out-"));
    try {
      const out = path.join(dir, "sub/result.json");
      const r = await runBench(args(["--replay", REPLAY, "--prompts", "06-badge", "--date", "2026-11-01", "--out", out]));
      expect(JSON.parse(fs.readFileSync(out, "utf-8"))).toEqual(JSON.parse(JSON.stringify(r)));
      expect(fs.readFileSync(out, "utf-8").endsWith("}\n")).toBe(true);
      expect(summaryLines(r).join("\n")).toMatch(/baseline[\s\S]*dsmith/);
      // --out 옆에 같은 이름의 .md 보고서
      expect(mdPathOf(out)).toBe(path.join(dir, "sub/result.md"));
      expect(fs.readFileSync(mdPathOf(out), "utf-8")).toBe(renderReport(r));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("CLI: --out 없는 replay는 파일을 쓰지 않고 마크다운을 표준 출력으로 내며, 두 번 실행해도 바이트 같다", () => {
    const cli = path.join(MONOREPO_ROOT, "benchmarks/dist/run.js");
    const argv = [cli, "--repo", "legacy-demo", "--replay", REPLAY, "--prompts", PROMPTS.join(","), "--date", "2026-11-01"];
    const run = () => spawnSync(process.execPath, argv, { cwd: os.tmpdir(), encoding: "utf-8" });
    const a = run();
    const b = run();
    expect(a.status).toBe(0);
    expect(a.stdout).toBe(b.stdout);
    expect(a.stdout.startsWith("# ")).toBe(true);
    expect(a.stdout).toContain("합성 산출물");
    expect(a.stdout).toContain("2026-11-01");
  }, 60_000);

  it("--dry-run 계획: 아무것도 실행하지 않고 수만 센다", async () => {
    const lines = await planBench(args(["--agent", "node x.mjs", "--repeat", "2", "--prompts", "06-badge,12-pagination", "--date", "2026-11-01", "--dry-run"]));
    expect(lines.join("\n")).toContain("실행 수: 8");
    expect(lines.join("\n")).toContain("중단 기준: 누적 $8 초과 또는 실패 6개 이상");
    expect(lines.join("\n")).toContain("예상 비용: 실행 8회 × ~$0.075 ≈ $0.6");
    expect(lines.join("\n")).toContain("agents-md");
    expect(lines.join("\n")).toContain("2026-11-01-legacy-demo.json");
    // 프롬프트는 id 순으로 센다
    expect(lines.join("\n")).toContain("06-badge, 12-pagination");
  });

  it("--dry-run --repeat 3 (12개 × 2조건 = 72회): 예상 비용과 실행 수에 맞춘 중단 기준을 보여 주고, 명시한 값은 그대로 쓴다", async () => {
    const text = (await planBench(args(["--repeat", "3", "--dry-run"]))).join("\n");
    expect(text).toContain("실행 수: 72");
    expect(text).toContain("예상 비용: 실행 72회 × ~$0.075 ≈ $5.4");
    expect(text).toContain("중단 기준: 누적 $9 초과 또는 실패 9개 이상");
    const custom = (await planBench(args(["--repeat", "3", "--max-total-usd", "4", "--max-failures", "3", "--dry-run"]))).join("\n");
    expect(custom).toContain("중단 기준: 누적 $4 초과 또는 실패 3개 이상");
    expect(custom).toContain("경고: 예상 비용 $5.4가 비용 한도 $4를 넘는다");
  });
});

interface FakeEnv {
  cwd: string;
  mode: string;
  entries: string[];
  agentsMd: string | null;
  hasDsmithDir: boolean;
  hasCatalog: boolean;
  hasBenchmarksDir: boolean;
  mcp: { mcpServers: { dsmith: { command: string; args: string[] } } } | null;
  claudeEnvKeys: number;
  path: string;
  dsmithOnPath: boolean;
}

describe("가짜 에이전트 e2e (--agent)", () => {
  let outRoot: string;
  let privateTmp: string;
  let prevTmp: string | undefined;
  const leftovers = (): string[] => fs.readdirSync(privateTmp).filter((n) => n.startsWith("dsmith-bench-"));

  beforeAll(() => {
    outRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-bench-e2e-out-")));
    privateTmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-bench-e2e-tmp-")));
    prevTmp = process.env.TMPDIR;
    process.env.TMPDIR = privateTmp; // 이 파일의 복사본만 여기에 생기게 해서 잔여물을 단언한다
  });
  afterAll(() => {
    if (prevTmp === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = prevTmp;
    fs.rmSync(outRoot, { recursive: true, force: true });
    fs.rmSync(privateTmp, { recursive: true, force: true });
  });

  const fakeArgs = (out: string, extra: string[] = []): BenchArgs =>
    args(["--agent", `${process.execPath} ${FAKE}`, "--install-tool", "claude-code", "--out", out, "--prompts", "06-badge,01-form", "--date", "2026-11-01", ...extra]);
  const transcript = (out: string, condition: string, id: string): FakeEnv =>
    JSON.parse(fs.readFileSync(path.join(path.dirname(out), "result", "transcripts", condition, `${id}-1.jsonl`), "utf-8").split("\n")[0] ?? "{}") as FakeEnv;

  it("조건별 격리·기록·replay 재채점·정리", async () => {
    const out = path.join(outRoot, "result.json");
    const lines: string[] = [];
    process.env.CLAUDE_LEAK_PROBE = "1";
    let result;
    try {
      result = await runBench(fakeArgs(out), (l) => lines.push(l));
    } finally {
      delete process.env.CLAUDE_LEAK_PROBE;
    }

    expect(result.mode).toBe("agent");
    expect(result.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.agent).toMatchObject({ command: `${process.execPath} ${FAKE}`, installTool: "claude-code", models: ["fake-model"] });
    expect(result.timeoutSec).toBe(600);
    expect(result.runs.map((r) => `${r.prompt}/${r.condition}/${r.status}`)).toEqual([
      "01-form/baseline/ok",
      "01-form/dsmith/ok",
      "06-badge/baseline/ok",
      "06-badge/dsmith/ok",
    ]);
    expect(result.runs.every((r) => r.exitCode === 0 && r.agentMeta?.costUsd === 0.001 && !r.harnessPathSeen && r.score.expectedFile)).toBe(true);
    expect(JSON.parse(fs.readFileSync(out, "utf-8"))).toEqual(JSON.parse(JSON.stringify(result)));
    expect(fs.readFileSync(path.join(outRoot, "result.md"), "utf-8")).toBe(renderReport(result));

    // 조건별 환경(가짜 에이전트가 본 cwd)
    for (const id of ["06-badge", "01-form"]) {
      const b = transcript(out, "baseline", id);
      const d = transcript(out, "dsmith", id);
      expect(b.mode).toBe("baseline");
      expect(d.mode).toBe("dsmith");
      // baseline: dsmith 흔적 없음
      expect(b.agentsMd).toBeNull();
      expect(b.hasDsmithDir).toBe(false);
      expect(b.mcp).toBeNull();
      expect(b.entries).not.toContain(".mcp.json");
      expect(b.entries).not.toContain(".claude");
      // dsmith: AGENTS.md DS 마커 + .mcp.json(node, args[0]=CLI_BIN) + 카탈로그
      expect(d.agentsMd).toContain("<!-- dsmith:ds:start -->");
      expect(d.mcp?.mcpServers.dsmith.command).toBe("node");
      expect(d.mcp?.mcpServers.dsmith.args[0]).toBe(CLI_BIN);
      expect(d.hasCatalog).toBe(true);
      // 공통: 복사본은 tmp 아래·모노레포 밖, benchmarks/ 없음, CLAUDE* 환경 변수 없음
      for (const e of [b, d]) {
        expect(e.cwd.startsWith(privateTmp)).toBe(true);
        expect(path.relative(MONOREPO_ROOT, e.cwd).startsWith("..")).toBe(true);
        expect(e.hasBenchmarksDir).toBe(false);
        expect(e.claudeEnvKeys).toBe(0);
        // 에이전트 PATH에는 모노레포(benchmarks/node_modules/.bin 등)가 없고 dsmith bin도 보이지 않는다
        expect(e.dsmithOnPath).toBe(false);
        expect(e.path.split(path.delimiter).filter((d) => d !== "" && !path.relative(MONOREPO_ROOT, d).startsWith(".."))).toEqual([]);
      }
      expect(b.cwd).not.toBe(d.cwd);
    }

    // 산출물(replay 배치)
    const record = path.join(outRoot, "result/outputs");
    for (const c of ["baseline", "dsmith"]) {
      for (const [id, file] of [["06-badge", "src/components/StockStatusBadge.tsx"], ["01-form", "src/components/ProductForm.tsx"]] as const) {
        expect(fs.existsSync(path.join(record, c, id, "1/files", file))).toBe(true);
        expect(JSON.parse(fs.readFileSync(path.join(record, c, id, "1/run.json"), "utf-8"))).toMatchObject({ status: "ok", exitCode: 0, agentMeta: { costUsd: 0.001, turns: 1 }, harnessPathSeen: false, deleted: [] });
      }
    }
    // 점수: baseline은 로컬 Button(DS 외) + 하드코딩, dsmith는 DS import + 토큰
    expect(result.aggregate.baseline).toMatchObject({ runs: 2, okRuns: 2, nonDs: 2, hardcoded: 2, token: 0, dsComponentUses: 0, costUsd: 0.002, turns: 2 });
    expect(result.aggregate.dsmith).toMatchObject({ runs: 2, nonDs: 0, hardcoded: 0, token: 4, knownToken: 4, dsComponentUses: 2, compliance: 1 });

    // MCP 호출·permission denial 집계(가짜 에이전트: dsmith 조건만 mcp__dsmith__* 2회)
    expect(result.runs.filter((r) => r.condition === "baseline").map((r) => r.agentMeta?.mcpToolCalls)).toEqual([0, 0]);
    expect(result.runs.filter((r) => r.condition === "dsmith").map((r) => r.agentMeta?.mcpToolCalls)).toEqual([2, 2]);
    expect(result.aggregate.baseline).toMatchObject({ mcpToolCalls: 0, permissionDenials: 0 });
    expect(result.aggregate.dsmith).toMatchObject({ mcpToolCalls: 4, permissionDenials: 0 });
    expect(result).toMatchObject({ status: "complete", abortReason: null });
    expect(result).not.toHaveProperty("replaySource");

    // 산출물 루트의 meta.json이 출처를 기록한다
    expect(JSON.parse(fs.readFileSync(path.join(record, "meta.json"), "utf-8"))).toMatchObject({ version: 1, source: "agent", repo: "legacy-demo", date: "2026-11-01" });

    // 기록한 산출물을 --replay로 다시 채점하면 같은 집계 — 출처는 agent
    const again = await runBench(args(["--replay", record, "--prompts", "06-badge,01-form", "--date", "2026-11-01"]));
    expect(again.mode).toBe("replay");
    expect(again.replaySource).toBe("agent");
    expect(renderReport(again)).toContain("실제 에이전트 실행의 산출물을 다시 채점한 결과(replay)다");
    expect(renderReport(again)).not.toContain("합성 산출물");
    expect(again.aggregate).toEqual(result.aggregate);

    // 실제 실행 결과 JSON을 bench:report --in 으로 다시 렌더링해도 mode는 agent이고 README 줄이 나온다
    const reported = reportFromFile(["--", "--", "--in", out], {});
    expect(reported.line).toMatch(/^벤치마크\(프롬프트 2개 × 조건 2, .*, 2026-11-01\): 토큰 준수율 0\.0% \(0\/2\) → 100\.0% \(4\/4\), DS 외 컴포넌트 2 → 0 — benchmarks\/results\/result\.md$/);
    expect(fs.readFileSync(reported.mdFile, "utf-8")).toBe(renderReport(result));
    expect(again.runs.map((r) => r.score)).toEqual(result.runs.map((r) => r.score));

    // keep: false → 복사본·템플릿·베이스가 남지 않는다
    expect(leftovers()).toEqual([]);
  }, 120_000);

  it("종료 코드 ≠ 0 → agent-error, 산출물은 채점된다", async () => {
    const out = path.join(outRoot, "exit/result.json");
    process.env.FAKE_AGENT_EXIT = "3";
    try {
      const r = await runBench(fakeArgs(out, ["--conditions", "dsmith", "--prompts", "06-badge", "--pass-env", "FAKE_AGENT_EXIT"]));
      expect(r.runs).toHaveLength(1);
      expect(r.runs[0]).toMatchObject({ status: "agent-error", exitCode: 3 });
      expect(r.runs[0]?.score.expectedFile).toBe(true);
      expect(r.runs[0]?.score.totals.token).toBeGreaterThan(0);
      expect(r.aggregate.dsmith).toMatchObject({ okRuns: 0, failedRuns: 1 });
    } finally {
      delete process.env.FAKE_AGENT_EXIT;
    }
    expect(leftovers()).toEqual([]);
  }, 120_000);

  it("timeout → status timeout, 변경 없음(기대 파일 없음)", async () => {
    const out = path.join(outRoot, "timeout/result.json");
    process.env.FAKE_AGENT_SLEEP_MS = "5000";
    try {
      const t0 = Date.now();
      const r = await runBench(fakeArgs(out, ["--conditions", "baseline", "--prompts", "06-badge", "--timeout", "1", "--pass-env", "FAKE_AGENT_SLEEP_MS"]));
      expect(Date.now() - t0).toBeLessThan(30_000);
      expect(r.runs[0]).toMatchObject({ status: "timeout", exitCode: null });
      expect(r.timeoutSec).toBe(1);
      expect(r.aggregate.baseline).toMatchObject({ failedRuns: 1, missingExpected: 1 });
    } finally {
      delete process.env.FAKE_AGENT_SLEEP_MS;
    }
    expect(leftovers()).toEqual([]);
  }, 120_000);

  it("누적 비용이 --max-total-usd를 넘으면 새 실행을 시작하지 않고 aborted로 부분 결과를 남긴다", async () => {
    const out = path.join(outRoot, "budget/result.json");
    process.env.FAKE_AGENT_COST = "0.4";
    const lines: string[] = [];
    let r;
    try {
      // 계획 4개(2프롬프트 × 2조건). 0.4 → 0.8 > 0.5 에서 멈춘다 = 2개 실행
      r = await runBench(fakeArgs(out, ["--max-total-usd", "0.5", "--pass-env", "FAKE_AGENT_COST"]), (l) => lines.push(l));
    } finally {
      delete process.env.FAKE_AGENT_COST;
    }
    expect(r.runs).toHaveLength(2);
    expect(r.status).toBe("aborted");
    expect(r.abortReason).toBe("누적 비용 $0.8 > 한도 $0.5");
    expect(lines.some((l) => l.includes("중단: 누적 비용"))).toBe(true);
    // 디스크의 결과도 같고, 보고서에 경고가 있으며, README 줄은 만들지 않는다
    const disk = JSON.parse(fs.readFileSync(out, "utf-8")) as BenchResult;
    expect(disk).toEqual(JSON.parse(JSON.stringify(r)));
    expect(fs.readFileSync(path.join(path.dirname(out), "result.md"), "utf-8")).toContain("계획한 실행 4개 중 2개만 집계했다");
    expect(reportFromFile(["--in", out], {}).line).toBeNull();
    expect(leftovers()).toEqual([]);
  }, 120_000);

  it("실패 실행이 --max-failures에 닿으면 멈춘다(agent-error·timeout·harness-error 모두 실패)", async () => {
    const out = path.join(outRoot, "failures/result.json");
    process.env.FAKE_AGENT_EXIT = "3";
    let r;
    try {
      r = await runBench(fakeArgs(out, ["--max-failures", "2", "--pass-env", "FAKE_AGENT_EXIT"]));
    } finally {
      delete process.env.FAKE_AGENT_EXIT;
    }
    expect(r.runs.map((x) => x.status)).toEqual(["agent-error", "agent-error"]);
    expect(r).toMatchObject({ status: "aborted", abortReason: "실패 실행 2개 ≥ 한도 2개" });
    expect(JSON.parse(fs.readFileSync(out, "utf-8")).status).toBe("aborted");
    expect(leftovers()).toEqual([]);
  }, 120_000);

  it("실행마다 결과 JSON을 원자적으로 갱신한다 — 중간 저장본은 읽을 수 있고 aborted, 끝나면 complete", async () => {
    const out = path.join(outRoot, "partial/result.json");
    const snapshots: BenchResult[] = [];
    const final = await runBench(fakeArgs(out), (l) => {
      if (l.startsWith("중간 저장")) snapshots.push(JSON.parse(fs.readFileSync(out, "utf-8")) as BenchResult);
    });
    expect(snapshots.map((s) => s.runs.length)).toEqual([1, 2, 3, 4]);
    expect(snapshots.every((s) => s.status === "aborted" && s.abortReason !== null && s.mode === "agent")).toBe(true);
    // 중간 저장본에서도 집계가 실행 수와 맞고 보고서를 만들 수 있다
    expect(snapshots[1]?.aggregate.baseline?.runs).toBe(1);
    expect(() => renderReport(snapshots[1] as BenchResult)).not.toThrow();
    expect(final.runs).toHaveLength(4);
    expect(final).toMatchObject({ status: "complete", abortReason: null });
    expect(JSON.parse(fs.readFileSync(out, "utf-8")).status).toBe("complete");
    // 임시 파일이 남지 않는다
    expect(fs.readdirSync(path.dirname(out)).filter((n) => n.includes(".tmp"))).toEqual([]);
  }, 120_000);

  it("실행 하나의 하네스 예외는 던지지 않고 harness-error로 기록하고 다음 실행을 계속한다", async () => {
    const out = path.join(outRoot, "harness-error/result.json");
    const lines: string[] = [];
    // 에이전트가 복사본의 .git을 지우면 collectChanges(git status)가 던진다
    const r = await runBench(args(["--agent", "rm -rf .git", "--agent-version", "none", "--install-tool", "claude-code", "--out", out, "--prompts", "06-badge", "--date", "2026-11-01"]), (l) => lines.push(l));
    expect(r.runs.map((x) => `${x.condition}/${x.status}`)).toEqual(["baseline/harness-error", "dsmith/harness-error"]);
    expect(r.runs[0]?.error).toMatch(/git status 실패/);
    expect(r.runs[0]?.score.expectedFile).toBe(false);
    expect(r).toMatchObject({ status: "complete", abortReason: null });
    expect(r.aggregate.baseline).toMatchObject({ runs: 1, okRuns: 0, failedRuns: 1 });
    expect(lines.some((l) => l.includes("harness-error"))).toBe(true);
    expect(leftovers()).toEqual([]);
  }, 120_000);

  it("stdout에 benchmarks 경로가 나오면 harnessPathSeen, --keep이면 복사본을 남기고 경로를 로그한다", async () => {
    const out = path.join(outRoot, "harness/result.json");
    const lines: string[] = [];
    const agent = `echo ${path.join(MONOREPO_ROOT, "benchmarks/src/score.ts")}`;
    const r = await runBench(args(["--agent", agent, "--install-tool", "claude-code", "--out", out, "--prompts", "06-badge", "--conditions", "dsmith", "--keep", "--date", "2026-11-01"]), (l) => lines.push(l));
    expect(r.runs[0]).toMatchObject({ status: "ok", harnessPathSeen: true });
    expect(r.aggregate.dsmith).toMatchObject({ harnessPathSeen: 1, missingExpected: 1 });
    const kept = lines.find((l) => l.includes("복사본 유지"))?.split(": ")[1];
    expect(kept).toBeDefined();
    expect(fs.existsSync(path.join(kept ?? "", ".mcp.json"))).toBe(true);
    // --keep: 실행 복사본만 남고 베이스·템플릿은 지워진다
    expect(leftovers()).toEqual([path.basename(kept ?? "")]);
    fs.rmSync(kept ?? "", { recursive: true, force: true });
  }, 120_000);
});

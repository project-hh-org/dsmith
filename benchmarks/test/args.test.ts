import path from "node:path";
import { describe, expect, it } from "vitest";
import { MONOREPO_ROOT } from "../src/base.js";
import { CLAUDE_AGENT_COMMAND, parseBenchArgs } from "../src/run.js";

describe("parseBenchArgs", () => {
  it("기본값: legacy-demo, 조건 2개, repeat 1, timeout 600", () => {
    const a = parseBenchArgs(["--replay", "/abs/replay/legacy-demo"]);
    expect(a).toMatchObject({
      repo: "legacy-demo",
      agent: null,
      replay: "/abs/replay/legacy-demo",
      maxTotalUsd: 8,
      maxFailures: 6,
      conditions: ["baseline", "dsmith"],
      repeat: 1,
      prompts: null,
      out: null,
      record: null,
      timeoutSec: 600,
      installTool: null,
      passEnv: [],
      keep: false,
      date: null,
      agentVersion: null,
      dryRun: false,
    });
  });

  it("--agent와 --replay 동시 → Error(사용법 포함)", () => {
    expect(() => parseBenchArgs(["--agent", "x", "--replay", "y"])).toThrow(/함께 쓸 수 없습니다[\s\S]*사용법/);
  });

  it("둘 다 없음 → Error", () => {
    expect(() => parseBenchArgs([])).toThrow(/--agent 또는 --replay/);
  });

  it("--dry-run만 있으면 기본 실측 명령(claude -p)의 계획을 보여 준다", () => {
    expect(parseBenchArgs(["--", "--", "--repo", "legacy-demo", "--dry-run"])).toMatchObject({ agent: CLAUDE_AGENT_COMMAND, replay: null, dryRun: true });
    expect(parseBenchArgs(["--replay", "/r", "--dry-run"])).toMatchObject({ agent: null, replay: "/r" });
  });

  it("모르는 repo·condition·옵션 → Error", () => {
    expect(() => parseBenchArgs(["--replay", "r", "--repo", "foo"])).toThrow(/모르는 --repo/);
    expect(() => parseBenchArgs(["--replay", "r", "--conditions", "baseline,other"])).toThrow(/모르는 --conditions/);
    expect(() => parseBenchArgs(["--replay", "r", "--nope"])).toThrow(/사용법/);
  });

  it("--repeat 범위 1..10", () => {
    expect(() => parseBenchArgs(["--replay", "r", "--repeat", "0"])).toThrow(/1\.\.10/);
    expect(() => parseBenchArgs(["--replay", "r", "--repeat", "11"])).toThrow(/1\.\.10/);
    expect(() => parseBenchArgs(["--replay", "r", "--repeat", "1.5"])).toThrow(/1\.\.10/);
    expect(parseBenchArgs(["--replay", "r", "--repeat", "10"]).repeat).toBe(10);
  });

  it("--prompts, --conditions, --pass-env(반복), --keep, --dry-run, --date", () => {
    const a = parseBenchArgs([
      "--replay", "r",
      "--prompts", "06-badge,12-pagination",
      "--conditions", "dsmith",
      "--pass-env", "FAKE_A",
      "--pass-env", "FAKE_B",
      "--keep",
      "--dry-run",
      "--date", "2026-11-01",
    ]);
    expect(a.prompts).toEqual(["06-badge", "12-pagination"]);
    expect(a.conditions).toEqual(["dsmith"]);
    expect(a.passEnv).toEqual(["FAKE_A", "FAKE_B"]);
    expect(a.keep).toBe(true);
    expect(a.dryRun).toBe(true);
    expect(a.date).toBe("2026-11-01");
  });

  it("조건은 baseline → dsmith 순으로 정렬하고 중복을 없앤다", () => {
    expect(parseBenchArgs(["--replay", "r", "--conditions", "dsmith,baseline,dsmith"]).conditions).toEqual(["baseline", "dsmith"]);
  });

  it("--pass-env에 CLAUDE* 는 거부", () => {
    expect(() => parseBenchArgs(["--replay", "r", "--pass-env", "CLAUDE_CODE_SESSION_ID"])).toThrow(/넘길 수 없습니다/);
  });

  it("잘못된 --date·--timeout → Error", () => {
    expect(() => parseBenchArgs(["--replay", "r", "--date", "11/01"])).toThrow(/YYYY-MM-DD/);
    expect(() => parseBenchArgs(["--replay", "r", "--timeout", "0"])).toThrow(/양수/);
  });

  it("`--`(pnpm 전달)는 몇 개든, 어디에 있든 무시한다", () => {
    const env = { INIT_CWD: "/w" };
    // `pnpm bench -- --repo x` → 루트 스크립트가 끝에 `--`를 붙여 `-- --` 로 들어온다
    expect(parseBenchArgs(["--", "--", "--replay", "r"], env).replay).toBe("/w/r");
    expect(parseBenchArgs(["--", "--replay", "r"], env).replay).toBe("/w/r");
    // `pnpm bench --repo x` → `--` 없이 들어온다
    expect(parseBenchArgs(["--replay", "r", "--repo", "with-ds-app"], env)).toMatchObject({ replay: "/w/r", repo: "with-ds-app" });
    expect(parseBenchArgs(["--replay", "r", "--", "--repo", "with-ds-app"], env).repo).toBe("with-ds-app");
  });

  it("--out·--record·--replay 상대 경로는 호출한 cwd(INIT_CWD, 없으면 process.cwd())로 푼다", () => {
    const a = parseBenchArgs(["--agent", "x", "--out", "res/a.json", "--record", "rec"], { INIT_CWD: "/w" });
    expect(a).toMatchObject({ out: "/w/res/a.json", record: "/w/rec" });
    expect(parseBenchArgs(["--replay", "/abs/r"], { INIT_CWD: "/w" }).replay).toBe("/abs/r");
    expect(parseBenchArgs(["--replay", "r"], {}).replay).toBe(path.resolve("r"));
  });

  it("--replay-set <이름>은 benchmarks/replay/<이름>(cwd 무관)", () => {
    expect(parseBenchArgs(["--replay-set", "legacy-demo"], { INIT_CWD: "/w" }).replay).toBe(path.join(MONOREPO_ROOT, "benchmarks/replay/legacy-demo"));
    expect(() => parseBenchArgs(["--replay-set", "../x"])).toThrow(/--replay-set/);
    expect(() => parseBenchArgs(["--replay-set", "a", "--replay", "b"])).toThrow(/함께 쓸 수 없습니다/);
  });

  it("중단 기준: --max-total-usd 기본 8, --max-failures 기본 6, 잘못된 값은 Error", () => {
    expect(parseBenchArgs(["--agent", "x"])).toMatchObject({ maxTotalUsd: 8, maxFailures: 6 });
    expect(parseBenchArgs(["--agent", "x", "--max-total-usd", "1.5", "--max-failures", "2"])).toMatchObject({ maxTotalUsd: 1.5, maxFailures: 2 });
    expect(() => parseBenchArgs(["--agent", "x", "--max-total-usd", "0"])).toThrow(/--max-total-usd/);
    expect(() => parseBenchArgs(["--agent", "x", "--max-total-usd", "abc"])).toThrow(/--max-total-usd/);
    expect(() => parseBenchArgs(["--agent", "x", "--max-failures", "0"])).toThrow(/--max-failures/);
    expect(() => parseBenchArgs(["--agent", "x", "--max-failures", "1.5"])).toThrow(/--max-failures/);
  });

  it('"claude -p" 약식은 결정 5의 전체 명령으로 펼치고, 그 밖의 명령은 그대로 둔다', () => {
    expect(parseBenchArgs(["--agent", "claude -p"]).agent).toBe(CLAUDE_AGENT_COMMAND);
    for (const flag of ["--output-format stream-json", "--verbose", "--model sonnet", "--max-turns 20", "--max-budget-usd 0.5", "--permission-mode acceptEdits", "--allowedTools mcp__dsmith", "--setting-sources project", "--no-session-persistence"]) {
      expect(CLAUDE_AGENT_COMMAND).toContain(flag);
    }
    expect(parseBenchArgs(["--agent", "codex exec"]).agent).toBe("codex exec");
  });
});

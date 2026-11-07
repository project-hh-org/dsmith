import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { comparisons, displayConditions } from "../src/analysis.js";
import { mergeResults } from "../src/merge.js";
import { CONDITIONS, DEFAULT_CONDITIONS, type BenchResult, type Condition, type IndependentScore, type RunRecord, type RunScore } from "../src/model.js";
import { ablationLine, renderReport, reportFromFile, toPosixRelative } from "../src/report.js";
import { parseBenchArgs, planBench } from "../src/run.js";
import { MONOREPO_ROOT } from "../src/paths.js";
import { aggregate } from "../src/score.js";

interface C {
  token?: number;
  tailwindDefault?: number;
  nonDs?: number;
  dsUses?: number;
}

function score(c: C): RunScore {
  const t = { token: c.token ?? 0, knownToken: c.token ?? 0, hardcoded: 0, replaceable: 0, tailwindDefault: c.tailwindDefault ?? 0, dynamic: 0, nonDs: c.nonDs ?? 0, deprecated: 0, dsComponentUses: c.dsUses ?? 0, parseFailed: 0, files: 1 };
  return { files: [], excluded: [], ignored: [], deleted: [], expectedFile: true, totals: t, compliance: null, tokenShareAll: null };
}

function indep(c: C): IndependentScore {
  const totals = { colorLiterals: 0, lengthLiterals: 0, tailwindPalette: c.tailwindDefault ?? 0, varDefined: c.token ?? 0, varUndefined: 0, dsComponents: 0, otherLocalComponents: c.nonDs ?? 0, parseFailed: 0, files: 1 };
  const den = totals.varDefined + totals.tailwindPalette;
  return { files: [], excluded: [], ignored: [], totals, indepUsage: den === 0 ? null : totals.varDefined / den, undefinedVars: [] };
}

/** 조건별 고정 값: 사용률 baseline 25% < agents-only 50% < mcp-only 75% < dsmith 100% */
const SPEC: Record<Condition, { c: C; mcp: number }> = {
  baseline: { c: { token: 1, tailwindDefault: 3, nonDs: 2 }, mcp: 0 },
  "agents-only": { c: { token: 2, tailwindDefault: 2, nonDs: 1 }, mcp: 0 },
  "mcp-only": { c: { token: 3, tailwindDefault: 1, nonDs: 1 }, mcp: 2 },
  dsmith: { c: { token: 4, tailwindDefault: 0, nonDs: 0, dsUses: 2 }, mcp: 3 },
};
const PROMPTS = ["01-a", "02-b", "03-c", "04-d"];

function run(prompt: string, condition: Condition, rep: number): RunRecord {
  const s = SPEC[condition];
  return { prompt, condition, rep, status: "ok", exitCode: 0, durationMs: 1, agentMeta: { costUsd: 0.05, mcpToolCalls: s.mcp, permissionDenials: 0 }, harnessPathSeen: false, score: score(s.c), independent: indep(s.c) };
}

function result(conditions: Condition[], over: Partial<BenchResult> = {}): BenchResult {
  const runs: RunRecord[] = [];
  for (const id of PROMPTS) for (const c of conditions) for (let rep = 1; rep <= 3; rep += 1) runs.push(run(id, c, rep));
  const agg: BenchResult["aggregate"] = {};
  for (const c of conditions) agg[c] = aggregate(runs.filter((r) => r.condition === c));
  return {
    version: 1,
    date: "2026-11-07",
    startedAt: "2026-11-07T01:00:00.000Z",
    repo: "legacy-demo",
    mode: "agent",
    agent: { command: "claude -p --model sonnet --allowedTools mcp__dsmith", version: "2.1.318 (Claude Code)", installTool: "claude-code", models: ["claude-sonnet-5-5"] },
    dsmith: { version: "0.1.0", commit: "70149c5d2fda2d383dc1d473cf5d87cfd9f6c38f" },
    base: { tokens: 14, dsComponents: 6, snapshotSha256: "2094d703f68dc9ecb9c051bb86e575e9d8880e3e06ef76597028b3c1652e4971" },
    prompts: PROMPTS.map((id) => ({ id, file: `src/components/${id}.tsx`, sha256: `sha-${id}` })),
    conditions,
    repeat: 3,
    timeoutSec: 600,
    status: "complete",
    abortReason: null,
    runs,
    aggregate: agg,
    ...over,
  };
}

const first = (): BenchResult => result(["baseline", "dsmith"]);
const second = (): BenchResult => result(["agents-only", "mcp-only"], { date: "2026-11-08", startedAt: "2026-11-08T01:00:00.000Z", agent: { command: "claude -p --model sonnet --allowedTools mcp__dsmith", version: "2.1.320 (Claude Code)", installTool: "claude-code", models: ["claude-sonnet-5-5"] }, dsmith: { version: "0.1.0", commit: "aaaaaaa0000000000000000000000000000000" } });
const merged = (): BenchResult => mergeResults([{ file: "r/a.json", result: first() }, { file: "r/b.json", result: second() }]);

describe("기존 2조건 보고서는 그대로", () => {
  it("커밋된 k3·k1 결과 JSON을 다시 렌더링하면 커밋된 md와 글자 그대로 같다", () => {
    for (const name of ["2026-11-07-legacy-demo-k3", "2026-11-07-legacy-demo"]) {
      const base = path.join(MONOREPO_ROOT, "benchmarks/results", name);
      const json = JSON.parse(readFileSync(`${base}.json`, "utf8")) as BenchResult;
      const md = readFileSync(`${base}.md`, "utf8");
      expect(renderReport(json, { recordPath: toPosixRelative(path.join(base, "outputs")) })).toBe(md);
    }
  });

  it("조건 목록: 기본은 baseline,dsmith, 전체는 다섯 개(agents-mcp 포함)이고 표 열·비교 쌍도 기존대로", () => {
    expect(DEFAULT_CONDITIONS).toEqual(["baseline", "dsmith"]);
    expect(CONDITIONS).toEqual(["baseline", "agents-only", "mcp-only", "agents-mcp", "dsmith"]);
    expect(parseBenchArgs(["--replay", "r"]).conditions).toEqual(["baseline", "dsmith"]);
    expect(displayConditions(first())).toEqual(["baseline", "dsmith"]);
    expect(displayConditions(result(["dsmith"]))).toEqual(["baseline", "dsmith"]);
    expect(comparisons(first())).toEqual([["baseline", "dsmith"]]);
    expect(comparisons(result(["dsmith"]))).toEqual([]);
  });
});

describe("--conditions agents-only,mcp-only", () => {
  it("파싱·정렬되고 --dry-run은 12 × 2 × 3 = 72회와 예상 비용을 낸다", async () => {
    const args = parseBenchArgs(["--repo", "legacy-demo", "--conditions", "mcp-only,agents-only", "--repeat", "3", "--dry-run"]);
    expect(args.conditions).toEqual(["agents-only", "mcp-only"]);
    const plan = (await planBench(args)).join("\n");
    expect(plan).toContain("조건: agents-only, mcp-only · 반복: 3 · 프롬프트 12개");
    expect(plan).toContain("실행 수: 72 (순차)");
    expect(plan).toContain("≈ $5.4");
  });
});

describe("4조건 보고서", () => {
  const md = renderReport(merged(), { recordPath: "r/x/outputs" });

  it("요약·프롬프트별·반복 통계에 네 조건 열이 있고 MCP 호출 수가 조건별로 나온다", () => {
    expect(md).toContain("| 지표 | baseline | agents-only | mcp-only | dsmith |");
    expect(md).toContain("| MCP 도구 호출 | 0 | 0 | 24 | 36 |");
    expect(md).toContain("agents-only 준수율");
    expect(md).toContain("| 토큰 사용률 | 25.0% (12/48) | 50.0% (24/48) | 75.0% (36/48) | 100.0% (48/48) |");
    expect(md).toContain("| id | 지표 | baseline | agents-only | mcp-only | dsmith |");
  });

  it("대응 비교: baseline 대비 세 조건, dsmith 대비 agents-only·mcp-only, 각각 같은 통계", () => {
    for (const h of ["### agents-only − baseline", "### mcp-only − baseline", "### dsmith − baseline", "### dsmith − agents-only", "### dsmith − mcp-only"]) expect(md).toContain(h);
    // 프롬프트 4개 모두 +50%p 차이 → 평균 차이 +50.0%p, 부호 검정 4/0 → p=0.1250
    const block = md.slice(md.indexOf("### dsmith − agents-only"), md.indexOf("### dsmith − mcp-only"));
    expect(block).toContain("평균 50.0% → 100.0%, 평균 차이 +50.0%p");
    expect(block).toContain("95% 부트스트랩 CI [+50.0, +50.0]");
    expect(block).toContain("95% t 구간");
    expect(block).toContain("증가 4 · 감소 0, 양쪽 정확 p=0.1250");
    expect(block).toContain("| id | agents-only 사용률 | dsmith 사용률 | 사용률 차이 | agents-only DS 외 | dsmith DS 외 | DS 외 차이 |");
  });

  it("독립 채점: 조건별 열, 비교 쌍마다 독립 사용률 통계와 일치도", () => {
    const i = md.indexOf("## 독립 채점");
    const sec = md.slice(i);
    expect(sec).toContain("| 지표 | baseline | agents-only | mcp-only | dsmith |");
    expect(sec).toContain("| 독립 사용률 | 25.0% (12/48) | 50.0% (24/48) | 75.0% (36/48) | 100.0% (48/48) |");
    expect(sec).toContain("| id | baseline 독립 사용률 | agents-only 독립 사용률 | mcp-only 독립 사용률 | dsmith 독립 사용률 | baseline 정의 없는 var |");
    for (const label of ["독립 사용률 (agents-only − baseline)", "독립 사용률 (dsmith − mcp-only)"]) expect(sec).toContain(`- ${label}: 평균`);
    expect(sec).toContain("- dsmith − agents-only: 프롬프트별 방향");
    expect(sec).toContain("합계: baseline 24 vs 24 · agents-only 12 vs 12 · mcp-only 12 vs 12 · dsmith 0 vs 0");
  });

  it("해석 한계: 2×2 분리 설명과 병합된 조건별 측정일", () => {
    const lim = md.slice(md.indexOf("## 해석 한계"));
    expect(lim).toContain("2×2 분리");
    expect(lim).not.toContain("분리하지 않았다");
    expect(lim).toContain("- 조건별 측정일이 다름: baseline·dsmith 2026-11-07(에이전트 2.1.318 (Claude Code)");
    expect(lim).toContain("agents-only·mcp-only 2026-11-08(에이전트 2.1.320 (Claude Code)");
    expect(lim).toContain("쌍 5개 × 지표 4개");
    expect(lim).toContain("`pnpm bench --repo legacy-demo --replay r/a/outputs --conditions baseline,dsmith`");
    expect(lim).toContain("`pnpm bench --repo legacy-demo --replay r/b/outputs --conditions agents-only,mcp-only`");
  });

  it("같은 날짜·버전이면 측정일 줄이 없다", () => {
    const same = mergeResults([{ file: "a.json", result: first() }, { file: "b.json", result: { ...second(), date: "2026-11-07", agent: first().agent, dsmith: first().dsmith } }]);
    expect(renderReport(same)).not.toContain("측정일이 다름");
    expect(renderReport(same)).not.toContain("버전이 다름");
  });
});

describe("mergeResults", () => {
  it("조건 4개·입력별 출처·최신 날짜·에이전트 버전 나열·실행 정렬", () => {
    const m = merged();
    expect(m.conditions).toEqual(["baseline", "agents-only", "mcp-only", "dsmith"]);
    expect(m.date).toBe("2026-11-08");
    expect(m.startedAt).toBe("2026-11-07T01:00:00.000Z");
    expect(m.agent.version).toBe("2.1.318 (Claude Code), 2.1.320 (Claude Code)");
    expect(m.runs).toHaveLength(4 * 4 * 3);
    expect(Object.keys(m.aggregate).sort()).toEqual(["agents-only", "baseline", "dsmith", "mcp-only"]);
    expect(m.merged?.map((s) => [s.file, s.conditions, s.date])).toEqual([
      ["r/a.json", ["baseline", "dsmith"], "2026-11-07"],
      ["r/b.json", ["agents-only", "mcp-only"], "2026-11-08"],
    ]);
    expect(m.status).toBe("complete");
  });

  const refuse = (a: BenchResult, b: BenchResult, re: RegExp): void => {
    expect(() => mergeResults([{ file: "a.json", result: a }, { file: "b.json", result: b }])).toThrow(re);
  };

  it("레포·스냅샷 해시·프롬프트·에이전트 명령·반복·겹치는 조건·중단·replay는 거부한다", () => {
    refuse(first(), { ...second(), repo: "with-ds-app" }, /병합 거부: b\.json의 레포가 a\.json와 다릅니다/);
    refuse(first(), { ...second(), base: { ...second().base, snapshotSha256: "f".repeat(64) } }, /베이스 스냅샷 sha256가 a\.json와 다릅니다 \(ffffffffffff ≠ 2094d703f68d\)/);
    refuse(first(), { ...second(), prompts: second().prompts.map((p, i) => (i === 0 ? { ...p, sha256: "changed" } : p)) }, /프롬프트 집합/);
    refuse(first(), { ...second(), prompts: second().prompts.slice(1) }, /프롬프트 집합/);
    refuse(first(), { ...second(), agent: { ...second().agent, command: "claude -p --model opus" } }, /에이전트 명령\(플래그\)/);
    refuse(first(), { ...second(), repeat: 1 }, /반복 수/);
    refuse(first(), result(["dsmith", "mcp-only"]), /조건 dsmith가 a\.json와 b\.json에 모두 있습니다/);
    refuse(first(), { ...second(), status: "aborted", abortReason: "비용" }, /중단된 결과/);
    refuse(first(), { ...second(), mode: "replay" }, /replay 결과/);
  });

  it("날짜·에이전트 버전·dsmith 커밋·관측 모델이 달라도 합친다", () => {
    expect(() => mergeResults([{ file: "a.json", result: first() }, { file: "b.json", result: { ...second(), agent: { ...second().agent, models: ["other"] } } }])).not.toThrow();
  });
});

describe("ablationLine", () => {
  it("한 줄: 조건별 토큰 사용률 평균(프롬프트 평균의 평균)과 보고서 링크", () => {
    const line = ablationLine(merged(), "benchmarks/results/x.md");
    expect(line).toBe(
      "MCP·AGENTS.md 분리(프롬프트 4개 × 조건 4 × 반복 3, claude -p, 2026-11-07·2026-11-08): 사용률 평균 baseline 25.0% · agents-only 50.0% · mcp-only 75.0% · 둘 다 100.0% — [benchmarks/results/x.md](benchmarks/results/x.md). 렌더링은 하지 않았고 모델·레포 하나다(해석 한계는 보고서 참고).",
    );
    expect(line).not.toContain("\n");
  });

  it("네 조건이 아니거나 replay·중단이면 Error", () => {
    expect(() => ablationLine(first(), "x.md")).toThrow(/네 조건이 모두 필요/);
    expect(() => ablationLine({ ...merged(), mode: "replay" }, "x.md")).toThrow(/replay/);
    expect(() => ablationLine({ ...merged(), status: "aborted", abortReason: "r" }, "x.md")).toThrow(/중단/);
  });
});

describe("bench:report --in a --in b", () => {
  let dir = "";
  afterEach(() => {
    if (dir !== "") rmSync(dir, { recursive: true, force: true });
  });

  it("--out 필수, 병합 보고서(.md)와 병합 JSON을 쓰고 2×2 줄을 돌려준다. 병합 JSON을 다시 렌더링하면 같은 보고서", () => {
    dir = mkdtempSync(path.join(os.tmpdir(), "dsmith-merge-test-"));
    const a = path.join(dir, "a.json");
    const b = path.join(dir, "b.json");
    writeFileSync(a, JSON.stringify(first()));
    writeFileSync(b, JSON.stringify(second()));
    expect(() => reportFromFile(["--in", a, "--in", b], {})).toThrow(/--out/);
    const out = reportFromFile(["--in", a, "--in", b, "--out", path.join(dir, "ab.md")], {});
    expect(out.jsonFile).toBe(path.join(dir, "ab.json"));
    expect(out.line).toContain("MCP·AGENTS.md 분리(");
    expect(out.line).toContain("사용률 평균 baseline 25.0% · agents-only 50.0% · mcp-only 75.0% · 둘 다 100.0%");
    const md = readFileSync(out.mdFile, "utf8");
    const again = reportFromFile(["--in", path.join(dir, "ab.json"), "--out", path.join(dir, "ab2.md")], {});
    expect(readFileSync(again.mdFile, "utf8")).toBe(md);
    // 다른 스냅샷이면 파일을 쓰기 전에 거부
    writeFileSync(b, JSON.stringify({ ...second(), base: { ...second().base, snapshotSha256: "0".repeat(64) } }));
    expect(() => reportFromFile(["--in", a, "--in", b, "--out", path.join(dir, "bad.md")], {})).toThrow(/병합 거부/);
  });
});

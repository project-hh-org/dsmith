import { describe, expect, it } from "vitest";
import type { RunRecord, RunScore } from "../src/model.js";
import { aggregate } from "../src/score.js";

const score = (c: { token: number; hardcoded: number; tailwindDefault?: number; nonDs?: number }, expectedFile = true): RunScore => ({
  files: [],
  excluded: [],
  ignored: [],
  deleted: [],
  expectedFile,
  totals: {
    token: c.token,
    knownToken: c.token,
    hardcoded: c.hardcoded,
    replaceable: c.hardcoded,
    tailwindDefault: c.tailwindDefault ?? 0,
    dynamic: 0,
    nonDs: c.nonDs ?? 0,
    deprecated: 0,
    dsComponentUses: 0,
    parseFailed: 0,
    files: 1,
  },
  compliance: null,
  tokenShareAll: null,
});

const rec = (over: Partial<RunRecord> & { score: RunScore }): RunRecord => ({
  prompt: "p",
  condition: "baseline",
  rep: 1,
  status: "ok",
  exitCode: 0,
  durationMs: 1,
  agentMeta: null,
  harnessPathSeen: false,
  ...over,
});

describe("aggregate", () => {
  it("빈 입력: 0건, 비율·비용 null", () => {
    expect(aggregate([])).toMatchObject({ runs: 0, okRuns: 0, failedRuns: 0, token: 0, compliance: null, tokenShareAll: null, costUsd: null, turns: null });
  });

  it("totals를 더한 뒤 비율을 다시 계산한다(실행별 비율의 평균이 아님)", () => {
    // 실행별 준수율 1.0 과 0.0 → 평균 0.5, 합산 비율은 9 / (9 + 1) = 0.9
    const a = aggregate([rec({ score: score({ token: 9, hardcoded: 0 }) }), rec({ rep: 2, score: score({ token: 0, hardcoded: 1, tailwindDefault: 10 }) })]);
    expect(a).toMatchObject({ runs: 2, token: 9, hardcoded: 1, tailwindDefault: 10, compliance: 0.9, tokenShareAll: 0.45 });
  });

  it("status별 성공/실패, 기대 파일 없음, harnessPathSeen, 비용·턴 합", () => {
    const a = aggregate([
      rec({ status: "ok", agentMeta: { costUsd: 0.1, turns: 3 }, score: score({ token: 1, hardcoded: 0 }) }),
      rec({ status: "replay", score: score({ token: 1, hardcoded: 0 }) }),
      rec({ status: "agent-error", harnessPathSeen: true, agentMeta: { costUsd: 0.2, turns: 4 }, score: score({ token: 0, hardcoded: 0, nonDs: 2 }) }),
      rec({ status: "timeout", score: score({ token: 0, hardcoded: 0 }, false) }),
      rec({ status: "missing", score: score({ token: 0, hardcoded: 0 }, false) }),
    ]);
    expect(a).toMatchObject({ runs: 5, okRuns: 2, failedRuns: 3, missingExpected: 2, harnessPathSeen: 1, nonDs: 2, costUsd: 0.3, turns: 7 });
  });
});

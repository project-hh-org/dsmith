import { describe, expect, it } from "vitest";
import { agreementOf, pairedAnalysis, perPromptSummary, perRepeatSeries } from "../src/analysis.js";
import type { BenchResult, Condition, IndependentScore, RunRecord, RunScore, TypeCheckRecord } from "../src/model.js";
import { readmeLine, renderReport } from "../src/report.js";
import { aggregate } from "../src/score.js";

interface C {
  token?: number;
  hardcoded?: number;
  tailwindDefault?: number;
  nonDs?: number;
  dsComponentUses?: number;
}

function score(c: C): RunScore {
  const t = { token: c.token ?? 0, knownToken: c.token ?? 0, hardcoded: c.hardcoded ?? 0, replaceable: 0, tailwindDefault: c.tailwindDefault ?? 0, dynamic: 0, nonDs: c.nonDs ?? 0, deprecated: 0, dsComponentUses: c.dsComponentUses ?? 0, parseFailed: 0, files: 1 };
  return { files: [], excluded: [], ignored: [], deleted: [], expectedFile: true, totals: t, compliance: null, tokenShareAll: null };
}

interface Ind {
  varDefined?: number;
  varUndefined?: number;
  colorLiterals?: number;
  lengthLiterals?: number;
  tailwindPalette?: number;
  dsComponents?: number;
  otherLocalComponents?: number;
}

function indep(i: Ind): IndependentScore {
  const totals = {
    colorLiterals: i.colorLiterals ?? 0,
    lengthLiterals: i.lengthLiterals ?? 0,
    tailwindPalette: i.tailwindPalette ?? 0,
    varDefined: i.varDefined ?? 0,
    varUndefined: i.varUndefined ?? 0,
    dsComponents: i.dsComponents ?? 0,
    otherLocalComponents: i.otherLocalComponents ?? 0,
    parseFailed: 0,
    files: 1,
  };
  const den = totals.varDefined + totals.varUndefined + totals.colorLiterals + totals.lengthLiterals + totals.tailwindPalette;
  return { files: [], excluded: [], ignored: [], totals, indepUsage: den === 0 ? null : totals.varDefined / den, undefinedVars: totals.varUndefined > 0 ? ["--made-up"] : [] };
}

const tc = (typeErrors: number): TypeCheckRecord => ({
  mode: "구문·의미 검사(의존성 타입 없이)",
  filesChecked: 1,
  typeErrors,
  diagnostics: typeErrors > 0 ? [{ file: "src/components/X.tsx", line: 3, code: 2322, message: "Type 'string' is not assignable to type 'number'." }] : [],
});

function run(prompt: string, condition: Condition, rep: number, c: C, extra: Partial<RunRecord> = {}): RunRecord {
  return { prompt, condition, rep, status: "ok", exitCode: 0, durationMs: 1, agentMeta: { costUsd: 0.05 }, harnessPathSeen: false, score: score(c), ...extra };
}

function build(runs: RunRecord[], repeat: number, prompts: string[]): BenchResult {
  return {
    version: 1,
    date: "2026-11-01",
    startedAt: "2026-11-01T01:00:00.000Z",
    repo: "legacy-demo",
    mode: "agent",
    agent: { command: "claude -p --model sonnet", version: "2.1.318", installTool: "claude-code", models: ["claude-sonnet-5-5"] },
    dsmith: { version: "0.1.0", commit: null },
    base: { tokens: 14, dsComponents: 6, snapshotSha256: "0123456789abcdef" },
    prompts: prompts.map((id) => ({ id, file: `src/components/${id}.tsx`, sha256: "x" })),
    conditions: ["baseline", "dsmith"],
    repeat,
    timeoutSec: 600,
    status: "complete",
    abortReason: null,
    runs,
    aggregate: { baseline: aggregate(runs.filter((r) => r.condition === "baseline")), dsmith: aggregate(runs.filter((r) => r.condition === "dsmith")) },
  };
}

/** 4개 프롬프트, 반복 3회, 반복마다 같은 값: 사용률 차이가 모두 +50%p */
const SPEC: Record<string, { base: C; ds: C }> = {
  "01-a": { base: { token: 1, tailwindDefault: 3, nonDs: 2 }, ds: { token: 3, tailwindDefault: 1 } },
  "02-b": { base: { tailwindDefault: 4, nonDs: 1 }, ds: { token: 2, tailwindDefault: 2 } },
  "03-c": { base: { token: 1, hardcoded: 1, tailwindDefault: 2 }, ds: { token: 3, hardcoded: 1 } },
  "04-d": { base: { hardcoded: 2, tailwindDefault: 2, nonDs: 1 }, ds: { token: 2, tailwindDefault: 2 } },
};

function constantResult(): BenchResult {
  const runs: RunRecord[] = [];
  for (const [id, s] of Object.entries(SPEC)) for (let rep = 1; rep <= 3; rep += 1) runs.push(run(id, "baseline", rep, s.base), run(id, "dsmith", rep, s.ds));
  return build(runs, 3, Object.keys(SPEC));
}

describe("analysis — 손으로 계산한 값", () => {
  const r = constantResult();

  it("프롬프트×조건 반복 요약: 반복이 같으면 평균=최소=최대", () => {
    expect(perPromptSummary(r, "01-a", "baseline", "usage")).toEqual({ n: 3, mean: 0.25, min: 0.25, max: 0.25 });
    expect(perPromptSummary(r, "01-a", "dsmith", "usage")).toEqual({ n: 3, mean: 0.75, min: 0.75, max: 0.75 });
    expect(perPromptSummary(r, "03-c", "baseline", "compliance")).toEqual({ n: 3, mean: 0.5, min: 0.5, max: 0.5 });
  });

  it("조건×반복 합산: 같은 반복 번호의 프롬프트 합계로 비율을 다시 계산", () => {
    // baseline token 1+0+1+0=2, 분모 (1+3)+(0+4)+(1+1+2)+(2+2)=16 → 0.125
    expect(perRepeatSeries(r, "baseline", "usage")).toEqual([0.125, 0.125, 0.125]);
    expect(perRepeatSeries(r, "baseline", "nonDs")).toEqual([4, 4, 4]);
    // dsmith token 3+2+3+2=10, 분모 4+4+4+4=16 → 0.625
    expect(perRepeatSeries(r, "dsmith", "usage")).toEqual([0.625, 0.625, 0.625]);
  });

  it("대응 비교: 사용률 차이가 모두 +0.5이면 평균 차이 0.5, CI [0.5, 0.5], 부호 검정 4/0 → p=2/16", () => {
    const p = pairedAnalysis(r, "usage");
    expect(p.n).toBe(4);
    expect(p.meanBaseline).toBeCloseTo(0.125, 12);
    expect(p.meanDsmith).toBeCloseTo(0.625, 12);
    expect(p.meanDiff).toBeCloseTo(0.5, 12);
    expect(p.ci?.lo).toBeCloseTo(0.5, 12);
    expect(p.ci?.hi).toBeCloseTo(0.5, 12);
    expect(p.sign).toMatchObject({ positive: 4, negative: 0, ties: 0, n: 4 });
    expect(p.sign.p).toBeCloseTo(0.125, 12);
  });

  it("DS 외 컴포넌트: 차이 -2·-1·0·-1 → 음수 3, 동률 1 제외, p = 2/8", () => {
    const p = pairedAnalysis(r, "nonDs");
    expect(p.rows.map((x) => x.diff)).toEqual([-2, -1, 0, -1]);
    expect(p.sign).toMatchObject({ positive: 0, negative: 3, ties: 1, n: 3 });
    expect(p.sign.p).toBeCloseTo(0.25, 12);
  });

  it("분모 0인 프롬프트는 사용률 대응에서 빠진다", () => {
    const runs = [
      run("01-a", "baseline", 1, { token: 1, tailwindDefault: 1 }),
      run("01-a", "dsmith", 1, { token: 2 }),
      run("02-b", "baseline", 1, {}),
      run("02-b", "dsmith", 1, { token: 1 }),
    ];
    const p = pairedAnalysis(build(runs, 1, ["01-a", "02-b"]), "usage");
    expect(p.n).toBe(1);
    expect(p.rows[1]).toMatchObject({ prompt: "02-b", baseline: null, diff: null });
  });
});

describe("renderReport — 반복 3회", () => {
  const md = renderReport(constantResult());

  it("반복 통계 절: 조건 표와 프롬프트별 표", () => {
    expect(md).toContain("## 반복 통계");
    expect(md).toContain("| 토큰 사용률 | 12.5% (12.5%–12.5%) | 62.5% (62.5%–62.5%) |");
    expect(md).toContain("| DS 외 컴포넌트 | 4.0 (4–4) | 0.0 (0–0) |");
    expect(md).toContain("| 01-a | 사용률 | 25.0% (25.0%–25.0%) | 75.0% (75.0%–75.0%) |");
    expect(md).toContain("| 03-c | 준수율 | 50.0% (50.0%–50.0%) | 75.0% (75.0%–75.0%) |");
  });

  it("대응 비교 절: 평균 차이·CI·부호 검정", () => {
    expect(md).toContain("- 토큰 사용률: 평균 12.5% → 62.5%, 평균 차이 +50.0%p, 95% 부트스트랩 CI [+50.0, +50.0] (프롬프트 4개 복원추출 10,000회, 시드 20261107), 95% t 구간 [+50.0, +50.0] (자유도 3, 비교용). 부호 검정(0 차이 0개 제외, n=4): 증가 4 · 감소 0, 양쪽 정확 p=0.1250.");
    expect(md).toContain("- DS 외 컴포넌트: 평균 1.00 → 0.00, 평균 차이 -1.00. 부호 검정(0 차이 1개 제외, n=3): 증가 0 · 감소 3, 양쪽 정확 p=0.2500.");
  });

  it("해석 한계: 반복했다고 밝히고, 단일 측정이라고 쓰지 않는다", () => {
    expect(md).toContain("- 반복 3회: 프롬프트·조건별 평균과 최소–최대를");
    expect(md).not.toContain("단일 측정이다");
  });

  it("README 줄: 평균·CI·부호 검정 형식", () => {
    expect(readmeLine(constantResult(), "benchmarks/results/x.md")).toBe(
      "벤치마크(프롬프트 4개 × 조건 2 × 반복 3, claude -p, 2026-11-01): 토큰 사용률 평균 12.5% → 62.5% (차이 +50.0%p, 95% CI [+50.0, +50.0], 부호 검정 p=0.1250), DS 외 컴포넌트 반복당 합계 4.0 → 0.0 (프롬프트 단위 부호 검정 n=3, p=0.2500) — [benchmarks/results/x.md](benchmarks/results/x.md). 렌더링은 하지 않았고 모델·레포 하나다(해석 한계는 보고서 참고).",
    );
  });

  it("반복 사이에 값이 다르면 최소–최대가 벌어진다", () => {
    const runs = [
      run("01-a", "baseline", 1, { token: 1, tailwindDefault: 4 }),
      run("01-a", "baseline", 2, { token: 2, tailwindDefault: 3 }),
      run("01-a", "baseline", 3, { token: 3, tailwindDefault: 2 }),
      run("01-a", "dsmith", 1, { token: 4, tailwindDefault: 1 }),
      run("01-a", "dsmith", 2, { token: 4, tailwindDefault: 1 }),
      run("01-a", "dsmith", 3, { token: 4, tailwindDefault: 1 }),
    ];
    const out = renderReport(build(runs, 3, ["01-a"]));
    // baseline 사용률: 1/5, 2/5, 3/5 → 평균 40.0% (20.0%–60.0%)
    expect(out).toContain("| 토큰 사용률 | 40.0% (20.0%–60.0%) | 80.0% (80.0%–80.0%) |");
    expect(out).toContain("| 01-a | 사용률 | 40.0% (20.0%–60.0%) | 80.0% (80.0%–80.0%) |");
  });
});

describe("renderReport — 반복 1회는 README 줄 형식이 그대로", () => {
  it("반복 1회 결과의 README 줄에는 CI·부호 검정이 없다", () => {
    const runs = [run("01-a", "baseline", 1, { token: 1, hardcoded: 3 }), run("01-a", "dsmith", 1, { token: 3, hardcoded: 1 })];
    const line = readmeLine(build(runs, 1, ["01-a"]), "benchmarks/results/x.md");
    expect(line).toBe("벤치마크(프롬프트 1개 × 조건 2, claude -p, 2026-11-01): 토큰 준수율 25.0% (1/4) → 75.0% (3/4), DS 외 컴포넌트 0 → 0 — [benchmarks/results/x.md](benchmarks/results/x.md). 렌더링은 하지 않았고 모델·레포 하나다(해석 한계는 보고서 참고).");
    expect(line).not.toContain("CI");
  });
});

describe("독립 채점 절·일치도", () => {
  function withIndep(): BenchResult {
    const runs = [
      // 01-a: dsmith 사용률 0.25 → 0.75, 독립 사용률 0 → 0.5 : 방향 일치
      run("01-a", "baseline", 1, { token: 1, tailwindDefault: 3, nonDs: 1 }, { independent: indep({ tailwindPalette: 3, otherLocalComponents: 2 }), typeCheck: tc(1) }),
      run("01-a", "dsmith", 1, { token: 3, tailwindDefault: 1 }, { independent: indep({ varDefined: 2, tailwindPalette: 1, colorLiterals: 1, dsComponents: 1 }), typeCheck: tc(0) }),
      // 02-b: dsmith 사용률 0.5 → 0.25 (악화), 독립 사용률 0 → 0.5 (개선) : 방향 불일치
      run("02-b", "baseline", 1, { token: 2, tailwindDefault: 2 }, { independent: indep({ tailwindPalette: 2 }), typeCheck: tc(0) }),
      run("02-b", "dsmith", 1, { token: 1, tailwindDefault: 3 }, { independent: indep({ varDefined: 2, varUndefined: 1, colorLiterals: 1 }), typeCheck: tc(0) }),
      // 03-c: dsmith 쪽 분모 0 → 판정 불가
      run("03-c", "baseline", 1, { token: 1, tailwindDefault: 1 }, { independent: indep({ tailwindPalette: 1 }), typeCheck: tc(0) }),
      run("03-c", "dsmith", 1, {}, { independent: indep({ varDefined: 1 }), typeCheck: tc(0) }),
    ];
    return build(runs, 1, ["01-a", "02-b", "03-c"]);
  }

  it("프롬프트별 방향 일치도", () => {
    const a = agreementOf(withIndep());
    expect(a.perPrompt.map((p) => [p.prompt, p.verdict])).toEqual([
      ["01-a", "일치"],
      ["02-b", "불일치"],
      ["03-c", "판정 불가"],
    ]);
    expect(a).toMatchObject({ agree: 1, disagree: 1, undetermined: 1 });
    // DS 외 vs 그 밖의 로컬: baseline 1 vs 2, dsmith 0 vs 0
    expect(a.nonDsTotals.baseline).toEqual({ dsmith: 1, independent: 2 });
    expect(a.nonDsEqual).toEqual({ equal: 5, n: 6 });
  });

  it("독립 채점 절의 표와 일치도 문장", () => {
    const md = renderReport(withIndep());
    expect(md).toContain("## 독립 채점");
    // baseline: defined 0 / (0 + 0 + 0 + 0 + 6) ; dsmith: defined 5 / (5 + 1 + 2 + 0 + 1)
    expect(md).toContain("| 독립 사용률 | 0.0% (0/6) | 55.6% (5/9) |");
    expect(md).toContain("| 정의 없는 var 참조 | 0 | 1 |");
    expect(md).toContain("| 정의 없는 var 이름 | — | --made-up |");
    expect(md).toContain("| 색 리터럴 | 0 | 2 |");
    expect(md).toContain("| DS 모듈 컴포넌트(JSX) | 0 | 1 |");
    expect(md).toContain("| 그 밖의 로컬 컴포넌트(JSX) | 2 | 0 |");
    expect(md).toContain("| 타입 오류(바뀐 파일) | 1 | 0 |");
    expect(md).toContain("| 타입 오류가 있는 실행 | 1/3 | 0/3 |");
    expect(md).toContain("| 검사 방식 | 구문·의미 검사(의존성 타입 없이) | 구문·의미 검사(의존성 타입 없이) |");
    expect(md).toContain("### 일치도");
    expect(md).toContain("- 프롬프트별 방향(dsmith 토큰 사용률 차이 vs 독립 사용률 차이): 일치 1 · 불일치 1 · 판정 불가 1");
    expect(md).toContain("합계: baseline 1 vs 2 · dsmith 0 vs 0. 같은 값인 실행 5/6");
    expect(md).toContain("- 채점 독립성: dsmith 엔진과 코드를 공유하지 않는 별도 채점기가");
    expect(md).toContain("- 타입 검사: 바뀐 파일을 TypeScript 컴파일러로 검사했다");
    expect(md).toContain("`baseline/01-a#1` src/components/X.tsx:3 TS2322");
  });

  it("반복 3회: README 줄에 독립 채점기 대응 평균·타입 오류가 들어가고, 사용률이 낮아진 프롬프트를 해석 한계에 설명한다", () => {
    const runs: RunRecord[] = [];
    for (const rep of [1, 2, 3]) {
      // 01-a: 독립 0 → 1 (개선). 02-b: dsmith 쪽은 DS 컴포넌트 2번 + 기본 스케일 1개 → 사용률 0% (악화)
      runs.push(
        run("01-a", "baseline", rep, { token: 1, tailwindDefault: 1 }, { independent: indep({ tailwindPalette: 2 }), typeCheck: tc(0) }),
        run("01-a", "dsmith", rep, { token: 3, tailwindDefault: 1 }, { independent: indep({ varDefined: 2 }), typeCheck: tc(0) }),
        run("02-b", "baseline", rep, { token: 1, tailwindDefault: 1 }, { independent: indep({ varDefined: 1, tailwindPalette: 1 }), typeCheck: tc(0) }),
        run("02-b", "dsmith", rep, { tailwindDefault: 1, dsComponentUses: 2 }, { independent: indep({ tailwindPalette: 1 }), typeCheck: tc(0) }),
      );
    }
    const result = build(runs, 3, ["01-a", "02-b"]);
    const line = readmeLine(result, "benchmarks/results/x.md");
    // 독립 사용률은 프롬프트 평균의 평균: baseline (0 + 0.5)/2 = 25.0%, dsmith (1 + 0)/2 = 50.0%
    expect(line).toContain("독립 채점기 기준 사용률 평균 25.0% → 50.0% (+25.0%p, 95% CI [");
    expect(line).toContain("부호 검정 p=1.0000), 타입 오류 0 → 0 — [benchmarks/results/x.md]");
    const md = renderReport(result);
    expect(md).toContain("- 토큰 사용률이 dsmith 쪽에서 오히려 낮아진 프롬프트: `02-b`(50.0% → 0.0%, dsmith DS 컴포넌트 사용 평균 2.0)");
    expect(md).toContain("지표 4개(토큰 사용률·DS 외 컴포넌트·DS 컴포넌트 사용·독립 사용률)");
  });

  it("독립·타입 기록이 없는 결과(옛 JSON)에는 독립 채점 절이 없다", () => {
    const md = renderReport(constantResult());
    expect(md).not.toContain("## 독립 채점");
  });
});

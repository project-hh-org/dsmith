import type { BenchResult, Condition, RunRecord } from "./model.js";
import { BOOTSTRAP_RESAMPLES, BOOTSTRAP_SEED, bootstrapMeanCI, mean, signTest, spearman, summarize, tMeanCI, type BootstrapCI, type SignTest, type Summary, type TInterval } from "./stats.js";

/**
 * 결과 JSON(BenchResult)에서 반복·대응 통계를 뽑는 순수 함수들. 파일시스템·난수 없음(부트스트랩은 고정 시드).
 *
 * 단위
 *  - 실행(run) 하나의 지표: 준수율·사용률·독립 사용률은 그 실행의 합계 비율(분모 0이면 null), nonDs·DS 사용·타입 오류는 정수.
 *  - 프롬프트 × 조건의 반복 요약: 반복(run)별 지표의 평균·최소·최대. null인 반복은 뺀다(전부 null이면 요약 없음).
 *  - 조건 × 반복의 합산: 같은 반복 번호의 12개 프롬프트 합계로 비율을 다시 계산한 뒤, 반복 사이의 평균·최소·최대.
 *  - 대응 비교: 프롬프트마다 (dsmith 평균 − baseline 평균). 어느 한쪽이 요약 없으면 그 프롬프트는 뺀다.
 */

export type MetricId = "compliance" | "usage" | "nonDs" | "dsUses" | "indepUsage" | "indepNonDs" | "typeErrors";

/** 합계 비율의 분자·분모 계산에 쓰는 실행별 합 */
export interface RunSums {
  token: number;
  hardcoded: number;
  tailwindDefault: number;
  nonDs: number;
  dsUses: number;
  /** 독립 채점 기록이 없으면 null */
  indep: { varDefined: number; denominator: number; otherLocal: number; dsComponents: number } | null;
  typeErrors: number | null;
}

export function sumsOf(run: RunRecord): RunSums {
  const t = run.score.totals;
  const ind = run.independent?.totals;
  return {
    token: t.token,
    hardcoded: t.hardcoded,
    tailwindDefault: t.tailwindDefault,
    nonDs: t.nonDs,
    dsUses: t.dsComponentUses,
    indep:
      ind === undefined
        ? null
        : {
            varDefined: ind.varDefined,
            denominator: ind.varDefined + ind.varUndefined + ind.colorLiterals + ind.lengthLiterals + ind.tailwindPalette,
            otherLocal: ind.otherLocalComponents,
            dsComponents: ind.dsComponents,
          },
    typeErrors: run.typeCheck === undefined ? null : run.typeCheck.typeErrors,
  };
}

const div = (n: number, d: number): number | null => (d === 0 ? null : n / d);

/** 합계 여러 개로 지표 하나를 계산한다(분모 0 또는 기록 없음이면 null) */
export function metricOfSums(sums: readonly RunSums[], metric: MetricId): number | null {
  if (sums.length === 0) return null;
  const sum = (f: (s: RunSums) => number): number => sums.reduce((a, s) => a + f(s), 0);
  switch (metric) {
    case "compliance":
      return div(sum((s) => s.token), sum((s) => s.token + s.hardcoded));
    case "usage":
      return div(sum((s) => s.token), sum((s) => s.token + s.hardcoded + s.tailwindDefault));
    case "nonDs":
      return sum((s) => s.nonDs);
    case "dsUses":
      return sum((s) => s.dsUses);
    case "indepUsage": {
      const withIndep = sums.filter((s) => s.indep !== null);
      if (withIndep.length === 0) return null;
      return div(withIndep.reduce((a, s) => a + (s.indep?.varDefined ?? 0), 0), withIndep.reduce((a, s) => a + (s.indep?.denominator ?? 0), 0));
    }
    case "indepNonDs": {
      const withIndep = sums.filter((s) => s.indep !== null);
      return withIndep.length === 0 ? null : withIndep.reduce((a, s) => a + (s.indep?.otherLocal ?? 0), 0);
    }
    case "typeErrors": {
      const withType = sums.filter((s) => s.typeErrors !== null);
      return withType.length === 0 ? null : withType.reduce((a, s) => a + (s.typeErrors ?? 0), 0);
    }
  }
}

export const runMetric = (run: RunRecord, metric: MetricId): number | null => metricOfSums([sumsOf(run)], metric);

const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export function promptIds(result: BenchResult): string[] {
  return [...new Set([...result.prompts.map((p) => p.id), ...result.runs.map((r) => r.prompt)])].sort(byCodeUnit);
}

/** 프롬프트 × 조건의 반복 요약. 값이 하나도 없으면 null */
export function perPromptSummary(result: BenchResult, prompt: string, condition: Condition, metric: MetricId): Summary | null {
  const values: number[] = [];
  for (const r of result.runs) {
    if (r.prompt !== prompt || r.condition !== condition) continue;
    const v = runMetric(r, metric);
    if (v !== null) values.push(v);
  }
  return summarize(values);
}

/** 조건 × 반복 번호별 합산 지표(반복 번호 순). 값이 null인 반복은 뺀다 */
export function perRepeatSeries(result: BenchResult, condition: Condition, metric: MetricId): number[] {
  const byRep = new Map<number, RunSums[]>();
  for (const r of result.runs) {
    if (r.condition !== condition) continue;
    const list = byRep.get(r.rep) ?? [];
    list.push(sumsOf(r));
    byRep.set(r.rep, list);
  }
  const out: number[] = [];
  for (const rep of [...byRep.keys()].sort((a, b) => a - b)) {
    const v = metricOfSums(byRep.get(rep) ?? [], metric);
    if (v !== null) out.push(v);
  }
  return out;
}

export interface PairedRow {
  prompt: string;
  baseline: Summary | null;
  dsmith: Summary | null;
  /** dsmith 평균 − baseline 평균, 한쪽이 없으면 null */
  diff: number | null;
}

export interface Paired {
  metric: MetricId;
  rows: PairedRow[];
  /** 포함된 프롬프트 수 */
  n: number;
  /** 포함된 프롬프트들의 baseline·dsmith 평균의 평균, 차이의 평균 */
  meanBaseline: number | null;
  meanDsmith: number | null;
  meanDiff: number | null;
  sign: SignTest;
  /** 평균 차이의 95% 부트스트랩 구간(프롬프트 재표본) */
  ci: BootstrapCI | null;
  /** 같은 차이의 95% t 구간(비교용). 프롬프트가 2개 미만이면 null */
  tci: TInterval | null;
}

/** 대응 비교: 두 조건이 다 있어야 의미가 있다. 없으면 모든 행이 diff null */
export function pairedAnalysis(result: BenchResult, metric: MetricId): Paired {
  const rows: PairedRow[] = promptIds(result).map((prompt) => {
    const baseline = perPromptSummary(result, prompt, "baseline", metric);
    const dsmith = perPromptSummary(result, prompt, "dsmith", metric);
    return { prompt, baseline, dsmith, diff: baseline !== null && dsmith !== null ? dsmith.mean - baseline.mean : null };
  });
  const used = rows.filter((r): r is PairedRow & { baseline: Summary; dsmith: Summary; diff: number } => r.diff !== null);
  const diffs = used.map((r) => r.diff);
  return {
    metric,
    rows,
    n: used.length,
    meanBaseline: used.length === 0 ? null : mean(used.map((r) => r.baseline.mean)),
    meanDsmith: used.length === 0 ? null : mean(used.map((r) => r.dsmith.mean)),
    meanDiff: used.length === 0 ? null : mean(diffs),
    sign: signTest(diffs),
    ci: bootstrapMeanCI(diffs, { seed: BOOTSTRAP_SEED, resamples: BOOTSTRAP_RESAMPLES }),
    tci: tMeanCI(diffs),
  };
}

export interface Agreement {
  /** dsmith 사용률 차이와 독립 사용률 차이의 방향이 같은 프롬프트 수 */
  agree: number;
  disagree: number;
  /** 어느 한쪽이 null이거나 0(방향 없음) */
  undetermined: number;
  /** 프롬프트 id → "일치" | "불일치" | "판정 불가" */
  perPrompt: { prompt: string; dsmithDiff: number | null; indepDiff: number | null; verdict: "일치" | "불일치" | "판정 불가" }[];
  /** 실행 단위 스피어만 ρ(dsmith 사용률 vs 독립 사용률), 둘 다 값이 있는 실행만. 쌍이 2개 미만이면 null */
  rhoUsage: { rho: number | null; n: number };
  /** 실행 단위 스피어만 ρ(dsmith nonDs vs 독립 other-local 컴포넌트) */
  rhoNonDs: { rho: number | null; n: number };
  /** nonDs와 독립 other-local이 같은 실행 수 / 비교한 실행 수 */
  nonDsEqual: { equal: number; n: number };
  /** 조건별 합계: dsmith nonDs, 독립 other-local */
  nonDsTotals: Partial<Record<Condition, { dsmith: number; independent: number }>>;
}

function rho(pairs: { x: number; y: number }[]): { rho: number | null; n: number } {
  return { rho: pairs.length < 2 ? null : spearman(pairs.map((p) => p.x), pairs.map((p) => p.y)), n: pairs.length };
}

/** dsmith 점수와 독립 점수가 같은 방향을 가리키는지 */
export function agreementOf(result: BenchResult): Agreement {
  const usage = pairedAnalysis(result, "usage");
  const indep = pairedAnalysis(result, "indepUsage");
  const indepByPrompt = new Map(indep.rows.map((r) => [r.prompt, r.diff]));
  const perPrompt: Agreement["perPrompt"] = usage.rows.map((r) => {
    const a = r.diff;
    const b = indepByPrompt.get(r.prompt) ?? null;
    const eps = 1e-9;
    const verdict: Agreement["perPrompt"][number]["verdict"] =
      a === null || b === null || Math.abs(a) < eps || Math.abs(b) < eps ? "판정 불가" : Math.sign(a) === Math.sign(b) ? "일치" : "불일치";
    return { prompt: r.prompt, dsmithDiff: a, indepDiff: b, verdict };
  });

  const usagePairs: { x: number; y: number }[] = [];
  const nonDsPairs: { x: number; y: number }[] = [];
  let equal = 0;
  const totals: Agreement["nonDsTotals"] = {};
  for (const r of result.runs) {
    const s = sumsOf(r);
    if (s.indep === null) continue;
    const u = runMetric(r, "usage");
    const iu = runMetric(r, "indepUsage");
    if (u !== null && iu !== null) usagePairs.push({ x: u, y: iu });
    nonDsPairs.push({ x: s.nonDs, y: s.indep.otherLocal });
    if (s.nonDs === s.indep.otherLocal) equal += 1;
    const t = totals[r.condition] ?? { dsmith: 0, independent: 0 };
    t.dsmith += s.nonDs;
    t.independent += s.indep.otherLocal;
    totals[r.condition] = t;
  }
  return {
    agree: perPrompt.filter((p) => p.verdict === "일치").length,
    disagree: perPrompt.filter((p) => p.verdict === "불일치").length,
    undetermined: perPrompt.filter((p) => p.verdict === "판정 불가").length,
    perPrompt,
    rhoUsage: rho(usagePairs),
    rhoNonDs: rho(nonDsPairs),
    nonDsEqual: { equal, n: nonDsPairs.length },
    nonDsTotals: totals,
  };
}

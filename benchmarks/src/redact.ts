import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { comparisons, metricOfSums, pairedAnalysis, sumsOf, type MetricId } from "./analysis.js";
import { MONOREPO_ROOT, REPOS } from "./base.js";
import { parsePrompt } from "./prompts.js";
import { DASH, byCodeUnit, pct, table } from "./format.js";
import { CONDITIONS, type Aggregate, type BenchResult, type Condition, type RepoName, type RunRecord } from "./model.js";

/**
 * 비공개 레포 결과 리댁션. 저장소에 커밋하는 것은 이 모듈이 만든 md와 요약 JSON뿐이다.
 *
 * 남기는 것: 레포 이름, 날짜, 모드, 조건, 반복, 스냅샷 sha256, 프롬프트 id·file(공개 벤치마크 프롬프트), 실행별 수치(metrics)와 집계·통계 수치.
 * 버리는 것(구조적으로 — 문자열 필드를 아예 복사하지 않는다): 앱 경로, 바뀐 파일 이름, 토큰 이름·값, 코드, finding 메시지, 정의 없는 var 이름,
 * DS 컴포넌트 이름·module, 타입 진단 메시지, 에이전트 명령·출력·오류 메시지, 하네스 경로.
 * 같은 입력이면 바이트 단위로 같은 출력이다(키 순서 고정, 난수 없음 — 부트스트랩은 고정 시드).
 */

export interface RedactedRun {
  condition: Condition;
  prompt: string;
  rep: number;
  /** 숫자(또는 null)뿐. 키 순서 고정 */
  metrics: Record<string, number | null>;
  /** 기대 파일 말고 바뀐 파일 수(이름은 버린다) */
  otherFiles: number;
}

export interface RedactedConditionSummary {
  aggregate: Aggregate;
  /** 독립 채점 합계(이름 없이 개수만). 독립 채점 기록이 없으면 null */
  independent: Record<string, number | null> | null;
  /** 실행 전체를 합쳐 다시 계산한 지표 */
  pooled: Record<string, number | null>;
}

export interface RedactedPair {
  metric: string;
  ref: Condition;
  cmp: Condition;
  n: number;
  meanRef: number | null;
  meanCmp: number | null;
  meanDiff: number | null;
  ciLo: number | null;
  ciHi: number | null;
  signPositive: number;
  signNegative: number;
  signTies: number;
  signP: number | null;
}

export interface RedactedSummary {
  conditions: Partial<Record<Condition, RedactedConditionSummary>>;
  pairs: RedactedPair[];
}

export interface RedactedResult {
  repo: string;
  date: string;
  mode: string;
  conditions: string[];
  repeat: number;
  snapshotSha256: string;
  prompts: { id: string; file: string }[];
  runs: RedactedRun[];
  summary: RedactedSummary;
}

const POOLED: [string, MetricId][] = [
  ["compliance", "compliance"],
  ["usage", "usage"],
  ["indepUsage", "indepUsage"],
  ["nonDs", "nonDs"],
  ["dsUses", "dsUses"],
  ["typeErrors", "typeErrors"],
];

const PAIR_METRICS: MetricId[] = ["usage", "indepUsage"];

const finite = (v: number | null | undefined): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function runMetrics(run: RunRecord, expectedFile: string | undefined): { metrics: Record<string, number | null>; otherFiles: number } {
  const s = run.score;
  const t = s.totals;
  const ind = run.independent?.totals;
  const changed = s.files.length + s.excluded.length + s.ignored.length + s.deleted.length;
  const otherFiles = Math.max(0, changed - (s.expectedFile && expectedFile !== undefined ? 1 : 0));
  const metrics: Record<string, number | null> = {
    ok: run.status === "ok" || run.status === "replay" ? 1 : 0,
    expectedFile: s.expectedFile ? 1 : 0,
    token: t.token,
    knownToken: t.knownToken,
    hardcoded: t.hardcoded,
    replaceable: t.replaceable,
    tailwindDefault: t.tailwindDefault,
    dynamic: t.dynamic,
    nonDs: t.nonDs,
    deprecated: t.deprecated,
    dsComponentUses: t.dsComponentUses,
    parseFailed: t.parseFailed,
    files: t.files,
    compliance: finite(s.compliance),
    tokenShareAll: finite(s.tokenShareAll),
    indepUsage: run.independent === undefined ? null : finite(run.independent.indepUsage),
    varDefined: ind === undefined ? null : ind.varDefined,
    varUndefined: ind === undefined ? null : ind.varUndefined,
    colorLiterals: ind === undefined ? null : ind.colorLiterals,
    lengthLiterals: ind === undefined ? null : ind.lengthLiterals,
    tailwindPalette: ind === undefined ? null : ind.tailwindPalette,
    themeRefs: ind === undefined ? null : (ind.themeRefs ?? 0),
    dsComponents: ind === undefined ? null : ind.dsComponents,
    otherLocalComponents: ind === undefined ? null : ind.otherLocalComponents,
    typeErrors: run.typeCheck === undefined ? null : run.typeCheck.typeErrors,
    costUsd: finite(run.agentMeta?.costUsd),
    durationMs: finite(run.durationMs),
  };
  return { metrics, otherFiles };
}

function independentSums(runs: RunRecord[]): Record<string, number | null> | null {
  const withIndep = runs.filter((r) => r.independent !== undefined);
  if (withIndep.length === 0) return null;
  const sum = (f: (t: NonNullable<RunRecord["independent"]>["totals"]) => number): number => withIndep.reduce((a, r) => a + (r.independent === undefined ? 0 : f(r.independent.totals)), 0);
  return {
    runs: withIndep.length,
    varDefined: sum((t) => t.varDefined),
    varUndefined: sum((t) => t.varUndefined),
    colorLiterals: sum((t) => t.colorLiterals),
    lengthLiterals: sum((t) => t.lengthLiterals),
    tailwindPalette: sum((t) => t.tailwindPalette),
    themeRefs: sum((t) => t.themeRefs ?? 0),
    dsComponents: sum((t) => t.dsComponents),
    otherLocalComponents: sum((t) => t.otherLocalComponents),
    parseFailed: sum((t) => t.parseFailed),
  };
}

/** Aggregate의 알려진 키(문자열 키를 새로 만들 수 없게 화이트리스트). 키를 빠뜨리면 컴파일 오류 */
const AGGREGATE_KEYS = Object.keys({
  token: 0, knownToken: 0, hardcoded: 0, replaceable: 0, tailwindDefault: 0, dynamic: 0,
  runs: 0, okRuns: 0, failedRuns: 0, missingExpected: 0, harnessPathSeen: 0, nonDs: 0, deprecated: 0, dsComponentUses: 0,
  parseFailed: 0, files: 0, compliance: 0, tokenShareAll: 0, costUsd: 0, turns: 0, mcpToolCalls: 0, permissionDenials: 0,
} satisfies Record<keyof Aggregate, 0>) as (keyof Aggregate)[];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const MODES = ["agent", "replay"] as const;

/** 입력 값을 오류 문구에 싣지 않는다(필드 이름만) */
function reject(field: string): never {
  throw new Error(`리댁션 거부: ${field} 값이 허용 범위 밖입니다`);
}

/** 레포의 커밋된 공개 프롬프트 (id → file) */
function publicPromptsOf(repo: RepoName): Map<string, string> {
  const dir = path.join(MONOREPO_ROOT, "benchmarks", REPOS[repo].prompts);
  const out = new Map<string, string>();
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
    const p = parsePrompt(name, readFileSync(path.join(dir, name), "utf8"));
    out.set(p.id, p.file);
  }
  return out;
}

/** 숫자(또는 null)만 남긴 집계. 알려진 키만, 값이 숫자·null이 아니면 거부 */
function numericAggregate(agg: Aggregate): Aggregate {
  const src = agg as unknown as Record<string, unknown>;
  const out: Record<string, number | null> = {};
  for (const key of AGGREGATE_KEYS) {
    const v = src[key];
    if (v === undefined) continue;
    if (v === null || (typeof v === "number" && Number.isFinite(v))) out[key] = v;
    else reject("aggregate");
  }
  return out as unknown as Aggregate;
}

/** 결과 JSON → 리댁션본. 입력을 바꾸지 않는다. 문자열 필드는 허용 목록·패턴·공개 프롬프트 집합과 대조하고, 어긋나면 거부한다 */
export function redactResult(result: BenchResult): RedactedResult {
  if (!Object.hasOwn(REPOS, result.repo)) reject("repo");
  if (typeof result.date !== "string" || !DATE.test(result.date)) reject("date");
  if (!(MODES as readonly unknown[]).includes(result.mode)) reject("mode");
  if (!Array.isArray(result.conditions) || !result.conditions.every((c) => CONDITIONS.includes(c))) reject("conditions");
  if (typeof result.base?.snapshotSha256 !== "string" || !SHA256.test(result.base.snapshotSha256)) reject("snapshotSha256");
  const publicPrompts = publicPromptsOf(result.repo);
  if (!result.prompts.every((p) => publicPrompts.get(p.id) === p.file)) reject("prompts");
  if (!result.runs.every((r) => publicPrompts.has(r.prompt) && CONDITIONS.includes(r.condition) && Number.isInteger(r.rep))) reject("runs prompt/condition/rep");
  if (!Number.isInteger(result.repeat)) reject("repeat");
  const fileOf = new Map(result.prompts.map((p) => [p.id, p.file]));
  const condIndex = (c: Condition): number => CONDITIONS.indexOf(c);
  const runs: RedactedRun[] = [...result.runs]
    .sort((a, b) => byCodeUnit(a.prompt, b.prompt) || condIndex(a.condition) - condIndex(b.condition) || a.rep - b.rep)
    .map((r) => ({ condition: r.condition, prompt: r.prompt, rep: r.rep, ...runMetrics(r, fileOf.get(r.prompt)) }));

  const conditions: RedactedSummary["conditions"] = {};
  for (const c of CONDITIONS) {
    if (!result.conditions.includes(c)) continue;
    const agg = result.aggregate[c];
    if (agg === undefined) continue;
    const condRuns = result.runs.filter((r) => r.condition === c);
    const sums = condRuns.map(sumsOf);
    const pooled: Record<string, number | null> = {};
    for (const [key, metric] of POOLED) pooled[key] = finite(metricOfSums(sums, metric));
    conditions[c] = { aggregate: numericAggregate(agg), independent: independentSums(condRuns), pooled };
  }

  const pairs: RedactedPair[] = [];
  for (const [ref, cmp] of comparisons(result)) {
    for (const metric of PAIR_METRICS) {
      const p = pairedAnalysis(result, metric, ref, cmp);
      pairs.push({
        metric,
        ref,
        cmp,
        n: p.n,
        meanRef: finite(p.meanBaseline),
        meanCmp: finite(p.meanDsmith),
        meanDiff: finite(p.meanDiff),
        ciLo: finite(p.ci?.lo),
        ciHi: finite(p.ci?.hi),
        signPositive: p.sign.positive,
        signNegative: p.sign.negative,
        signTies: p.sign.ties,
        signP: finite(p.sign.p),
      });
    }
  }

  return {
    repo: result.repo,
    date: result.date,
    mode: result.mode,
    conditions: [...result.conditions],
    repeat: result.repeat,
    snapshotSha256: result.base.snapshotSha256,
    prompts: result.prompts.map((p) => ({ id: p.id, file: p.file })),
    runs,
    summary: { conditions, pairs },
  };
}

/** 리댁션 요약 JSON 텍스트(끝에 줄바꿈) */
export function redactedJson(r: RedactedResult): string {
  return `${JSON.stringify(r, null, 2)}\n`;
}

/** 분자·분모를 슬래시 없이 적는다(보고서에 경로 모양 문자열이 없도록) */
function ratio(num: number, den: number): string {
  return den === 0 ? `${DASH} (${num}·${den})` : `${pct(num / den)} (${num}·${den})`;
}

const cell = (v: number | null | undefined, digits = 0): string => (v === null || v === undefined ? DASH : digits === 0 ? String(v) : v.toFixed(digits));

/** 리댁션본의 마크다운. 숫자와 프롬프트 id·file만 싣는다 */
export function renderRedactedReport(r: RedactedResult): string {
  const lines: string[] = [];
  const conds = CONDITIONS.filter((c) => r.conditions.includes(c));
  const sumOf = (c: Condition): RedactedConditionSummary | undefined => r.summary.conditions[c];
  const row = (label: string, f: (s: RedactedConditionSummary) => string): string[] => [label, ...conds.map((c) => { const s = sumOf(c); return s === undefined ? DASH : f(s); })];

  lines.push(
    `# 벤치마크 결과(리댁션) — ${r.repo} (${r.date})`,
    "",
    "비공개 앱의 결과다. 수치와 프롬프트 id·파일 이름만 싣는다. 앱의 경로, 바뀐 파일 이름, 토큰 이름, 코드, 진단 메시지는 싣지 않았다. 원본 결과는 저장소 밖에만 있다.",
    "",
    ...table(
      ["항목", "값"],
      [
        ["모드", r.mode],
        ["조건", r.conditions.join(", ")],
        ["반복", String(r.repeat)],
        ["프롬프트 수", String(r.prompts.length)],
        ["실행 수", String(r.runs.length)],
        ["스냅샷 sha256", r.snapshotSha256.slice(0, 12)],
      ],
    ),
    "",
    "## 요약",
    "",
    ...table(["지표", ...conds], [
      row("토큰 준수율", (s) => ratio(s.aggregate.token, s.aggregate.token + s.aggregate.hardcoded)),
      row("토큰 사용률", (s) => ratio(s.aggregate.token, s.aggregate.token + s.aggregate.hardcoded + s.aggregate.tailwindDefault)),
      row("token(known)", (s) => `${s.aggregate.token} (${s.aggregate.knownToken})`),
      row("hardcoded(대체 가능)", (s) => `${s.aggregate.hardcoded} (${s.aggregate.replaceable})`),
      row("dynamic", (s) => String(s.aggregate.dynamic)),
      row("DS 외 컴포넌트", (s) => String(s.aggregate.nonDs)),
      row("DS 컴포넌트 사용", (s) => String(s.aggregate.dsComponentUses)),
      row("파싱 실패", (s) => String(s.aggregate.parseFailed)),
      row("기대 파일 없음", (s) => String(s.aggregate.missingExpected)),
      row("실패 실행", (s) => String(s.aggregate.failedRuns)),
      row("비용(USD)", (s) => cell(s.aggregate.costUsd, 2)),
    ]),
    "",
  );

  if (conds.some((c) => sumOf(c)?.independent != null)) {
    const ind = (k: string) => (s: RedactedConditionSummary): string => cell(s.independent?.[k]);
    lines.push(
      "## 독립 채점",
      "",
      "dsmith 코드를 쓰지 않는 별도 채점기가 센 값이다. 독립 사용률 = (정의된 var 참조 + JS 테마 참조) 대 (그 둘 + 정의 없는 var + 색 리터럴 + 길이 리터럴 + Tailwind 기본 팔레트 + JS 테마 참조).",
      "",
      ...table(["지표", ...conds], [
        row("독립 사용률", (s) => pct(s.pooled["indepUsage"])),
        row("JS 테마 참조", ind("themeRefs")),
        row("정의된 var 참조", ind("varDefined")),
        row("정의 없는 var 참조", ind("varUndefined")),
        row("색 리터럴", ind("colorLiterals")),
        row("길이 리터럴", ind("lengthLiterals")),
        row("Tailwind 기본 팔레트", ind("tailwindPalette")),
        row("DS 모듈 컴포넌트", ind("dsComponents")),
        row("그 밖의 로컬 컴포넌트", ind("otherLocalComponents")),
        row("타입 오류", (s) => cell(s.pooled["typeErrors"])),
      ]),
      "",
    );
  }

  if (r.summary.pairs.length > 0) {
    lines.push(
      "## 조건 비교",
      "",
      "프롬프트마다 (비교 조건 평균 − 기준 조건 평균)을 구해 평균 냈다. 구간은 프롬프트 재표본 95% 부트스트랩(고정 시드), p는 부호 검정(양쪽 정확).",
      "",
      ...table(
        ["지표", "기준", "비교", "프롬프트 수", "기준 평균", "비교 평균", "차이 평균", "95% 구간", "부호 + · − · 동률", "p"],
        r.summary.pairs.map((p) => [
          p.metric === "usage" ? "토큰 사용률" : "독립 사용률",
          p.ref,
          p.cmp,
          String(p.n),
          pct(p.meanRef),
          pct(p.meanCmp),
          p.meanDiff === null ? DASH : `${p.meanDiff >= 0 ? "+" : "-"}${(Math.abs(p.meanDiff) * 100).toFixed(1)}%p`,
          p.ciLo === null || p.ciHi === null ? DASH : `${(p.ciLo * 100).toFixed(1)}% ~ ${(p.ciHi * 100).toFixed(1)}%`,
          `${p.signPositive} · ${p.signNegative} · ${p.signTies}`,
          p.signP === null ? DASH : p.signP.toFixed(4),
        ]),
      ),
      "",
    );
  }

  lines.push("## 프롬프트별", "");
  const byPrompt = (id: string, c: Condition): RedactedRun[] => r.runs.filter((x) => x.prompt === id && x.condition === c);
  const sumMetric = (runs: RedactedRun[], k: string): number => runs.reduce((a, x) => a + (x.metrics[k] ?? 0), 0);
  const promptRows = r.prompts.map((p) => [
    p.id,
    p.file,
    ...conds.map((c) => {
      const runs = byPrompt(p.id, c);
      if (runs.length === 0) return DASH;
      const token = sumMetric(runs, "token");
      const hard = sumMetric(runs, "hardcoded");
      const theme = sumMetric(runs, "themeRefs");
      const other = runs.reduce((a, x) => a + x.otherFiles, 0);
      return `준수 ${ratio(token, token + hard)} · 테마 참조 ${theme} · 다른 파일 ${other}`;
    }),
  ]);
  lines.push(...table(["id", "파일", ...conds], promptRows), "");

  lines.push(
    "## 해석 한계",
    "",
    "- 모델 하나, 에이전트 하나, 앱 하나의 결과다. 다른 모델과 코드베이스로 일반화하지 못한다.",
    "- 비공개 앱이라 산출물과 원본 결과를 공개하지 않는다. 같은 채점을 다시 내려면 앱 위치를 지정해 직접 실행해야 한다.",
    "- 렌더링은 하지 않았다. 토큰 사용 여부와 정적 규칙만 센다.",
    "",
  );
  return lines.join("\n");
}

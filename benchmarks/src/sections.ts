import {
  agreementOf,
  comparisons,
  displayConditions,
  isLegacyConditions,
  pairedAnalysis,
  perPromptSummary,
  perRepeatSeries,
  promptIds,
  metricOfSums,
  sumsOf,
  type MetricId,
  type Paired,
} from "./analysis.js";
import { DASH, num, pValue, pct, pp, ppNum, rangeCell, ratioCell, signedNum, table } from "./format.js";
import type { BenchResult, Condition, MergedSource, RunRecord } from "./model.js";
import { CONDITIONS } from "./model.js";
import { BOOTSTRAP_RESAMPLES, BOOTSTRAP_SEED, summarize } from "./stats.js";

/** 보고서의 통계·독립 채점 절. 숫자는 result 값과 analysis.ts의 순수 계산만 쓴다 */

export const hasIndependent = (result: BenchResult): boolean => result.runs.some((r) => r.independent !== undefined);
export const hasTypeCheck = (result: BenchResult): boolean => result.runs.some((r) => r.typeCheck !== undefined);

const runsOf = (result: BenchResult, c: Condition): RunRecord[] => result.runs.filter((r) => r.condition === c);

function metricCell(result: BenchResult, c: Condition, metric: MetricId, kind: "pct" | "count"): string {
  return rangeCell(summarize(perRepeatSeries(result, c, metric)), kind);
}

/** `## 반복 통계` — 반복이 2회 이상일 때만 */
export function repeatSection(result: BenchResult): string[] {
  if (result.repeat <= 1) return [];
  const k = result.repeat;
  const rows: [string, MetricId, "pct" | "count"][] = [
    ["토큰 준수율", "compliance", "pct"],
    ["토큰 사용률", "usage", "pct"],
    ["DS 외 컴포넌트", "nonDs", "count"],
    ["DS 컴포넌트 사용", "dsUses", "count"],
  ];
  if (hasIndependent(result)) rows.push(["독립 사용률", "indepUsage", "pct"]);
  if (hasTypeCheck(result)) rows.push(["타입 오류", "typeErrors", "count"]);
  const perPrompt: string[][] = [];
  const promptMetrics: [string, MetricId, "pct" | "count"][] = [
    ["준수율", "compliance", "pct"],
    ["사용률", "usage", "pct"],
    ["DS 외", "nonDs", "count"],
    ["DS 사용", "dsUses", "count"],
  ];
  const conds = displayConditions(result);
  for (const id of promptIds(result)) {
    for (const [label, metric, kind] of promptMetrics) {
      perPrompt.push([id, label, ...conds.map((c) => rangeCell(perPromptSummary(result, id, c, metric), kind))]);
    }
  }
  return [
    "## 반복 통계",
    "",
    `반복 ${k}회. 값은 평균 (최소–최대). 조건 표는 같은 반복 번호의 프롬프트 합계로 비율을 다시 계산한 뒤 반복 사이의 평균·최소·최대이고, 프롬프트별 표는 그 프롬프트의 반복별 값(분모 0인 반복은 제외)의 평균·최소·최대다.`,
    "",
    ...table(
      ["지표", ...conds],
      rows.map(([label, metric, kind]) => [label, ...conds.map((c) => metricCell(result, c, metric, kind))]),
    ),
    "",
    ...table(["id", "지표", ...conds], perPrompt),
    "",
  ];
}

function pairedStatLines(p: Paired, label: string, kind: "pct" | "count", withCi: boolean): string[] {
  if (p.n === 0 || p.meanDiff === null || p.meanBaseline === null || p.meanDsmith === null) return [`- ${label}: 대응 가능한 프롬프트가 없다.`];
  const s = p.sign;
  const sign = `부호 검정(0 차이 ${s.ties}개 제외, n=${s.n}): 증가 ${s.positive} · 감소 ${s.negative}, 양쪽 정확 p=${pValue(s.p)}`;
  if (kind === "pct") {
    const ci =
      withCi && p.ci !== null ? `, 95% 부트스트랩 CI [${ppNum(p.ci.lo)}, ${ppNum(p.ci.hi)}] (프롬프트 ${p.n}개 복원추출 ${BOOTSTRAP_RESAMPLES.toLocaleString("en-US")}회, 시드 ${BOOTSTRAP_SEED})` : "";
    const t = withCi && p.tci !== null ? `, 95% t 구간 [${ppNum(p.tci.lo)}, ${ppNum(p.tci.hi)}] (자유도 ${p.tci.df}, 비교용)` : "";
    return [`- ${label}: 평균 ${pct(p.meanBaseline)} → ${pct(p.meanDsmith)}, 평균 차이 ${pp(p.meanDiff)}${ci}${t}. ${sign}.`];
  }
  return [`- ${label}: 평균 ${num(p.meanBaseline)} → ${num(p.meanDsmith)}, 평균 차이 ${signedNum(p.meanDiff)}. ${sign}.`];
}

/** `## 대응 비교` — 두 조건이 다 있을 때. 프롬프트마다 (dsmith 평균 − baseline 평균) */
export function pairedSection(result: BenchResult): string[] {
  const pairs = comparisons(result);
  if (pairs.length === 0) return [];
  if (isLegacyConditions(result)) {
    return [
      "## 대응 비교",
      "",
      "프롬프트마다 반복 평균을 구해 (dsmith − baseline)을 대응시킨다. 토큰 사용률의 분모가 0인 쪽은 그 프롬프트를 사용률 비교에서 뺀다(—).",
      "",
      ...pairedBlock(result, "baseline", "dsmith"),
    ];
  }
  const out = [
    "## 대응 비교",
    "",
    "프롬프트마다 반복 평균을 구해 (비교 조건 − 기준 조건)을 대응시킨다. 쌍은 baseline 대비 각 조건, 그리고 agents-only·mcp-only 대비 dsmith다. 토큰 사용률의 분모가 0인 쪽은 그 프롬프트를 사용률 비교에서 뺀다(—). `.claude/skills`는 dsmith 조건에만 있어 dsmith를 비교 조건으로 하는 쌍의 차이에는 스킬이 섞인다.",
    "",
  ];
  for (const [ref, cmp] of pairs) out.push(`### ${cmp} − ${ref} (${PAIR_MEANING[`${ref}>${cmp}`] ?? "비교"})`, "", ...pairedBlock(result, ref, cmp));
  return out;
}

const PAIR_MEANING: Record<string, string> = {
  "baseline>agents-only": "AGENTS.md 섹션만 더한 효과",
  "baseline>mcp-only": "MCP 서버만 더한 효과",
  "baseline>dsmith": "전부 더한 효과",
  "agents-only>dsmith": "MCP 서버·스킬을 더한 효과",
  "mcp-only>dsmith": "AGENTS.md 섹션·스킬을 더한 효과",
};

/** 대응 비교 한 쌍의 표와 통계 줄(끝에 빈 줄 포함). 필드 baseline = 기준 조건, dsmith = 비교 조건 */
function pairedBlock(result: BenchResult, ref: Condition, cmp: Condition): string[] {
  const usage = pairedAnalysis(result, "usage", ref, cmp);
  const nonDs = pairedAnalysis(result, "nonDs", ref, cmp);
  const dsUses = pairedAnalysis(result, "dsUses", ref, cmp);
  const byPrompt = new Map(nonDs.rows.map((r) => [r.prompt, r]));
  const rows = usage.rows.map((r) => {
    const n = byPrompt.get(r.prompt);
    return [
      r.prompt,
      pct(r.baseline?.mean),
      pct(r.dsmith?.mean),
      pp(r.diff),
      num(n?.baseline?.mean, 1),
      num(n?.dsmith?.mean, 1),
      signedNum(n?.diff, 1),
    ];
  });
  return [
    ...table(["id", `${ref} 사용률`, `${cmp} 사용률`, "사용률 차이", `${ref} DS 외`, `${cmp} DS 외`, "DS 외 차이"], rows),
    "",
    ...pairedStatLines(usage, "토큰 사용률", "pct", true),
    ...pairedStatLines(nonDs, "DS 외 컴포넌트", "count", false),
    ...pairedStatLines(dsUses, "DS 컴포넌트 사용", "count", false),
    "",
  ];
}

interface IndepSums {
  varDefined: number;
  varUndefined: number;
  colorLiterals: number;
  lengthLiterals: number;
  tailwindPalette: number;
  dsComponents: number;
  otherLocalComponents: number;
  parseFailed: number;
  runs: number;
  undefinedNames: Set<string>;
}

function indepSums(runs: RunRecord[]): IndepSums {
  const s: IndepSums = { varDefined: 0, varUndefined: 0, colorLiterals: 0, lengthLiterals: 0, tailwindPalette: 0, dsComponents: 0, otherLocalComponents: 0, parseFailed: 0, runs: 0, undefinedNames: new Set() };
  for (const r of runs) {
    const t = r.independent?.totals;
    if (t === undefined) continue;
    s.runs += 1;
    s.varDefined += t.varDefined;
    s.varUndefined += t.varUndefined;
    s.colorLiterals += t.colorLiterals;
    s.lengthLiterals += t.lengthLiterals;
    s.tailwindPalette += t.tailwindPalette;
    s.dsComponents += t.dsComponents;
    s.otherLocalComponents += t.otherLocalComponents;
    s.parseFailed += t.parseFailed;
    for (const n of r.independent?.undefinedVars ?? []) s.undefinedNames.add(n);
  }
  return s;
}

const indepDen = (s: IndepSums): number => s.varDefined + s.varUndefined + s.colorLiterals + s.lengthLiterals + s.tailwindPalette;

interface TypeSums {
  checkedRuns: number;
  errors: number;
  runsWithErrors: number;
  modes: string[];
}

function typeSums(runs: RunRecord[]): TypeSums {
  const t: TypeSums = { checkedRuns: 0, errors: 0, runsWithErrors: 0, modes: [] };
  for (const r of runs) {
    if (r.typeCheck === undefined) continue;
    t.checkedRuns += 1;
    t.errors += r.typeCheck.typeErrors;
    if (r.typeCheck.typeErrors > 0) t.runsWithErrors += 1;
    if (!t.modes.includes(r.typeCheck.mode)) t.modes.push(r.typeCheck.mode);
  }
  t.modes.sort();
  return t;
}

function listNames(names: Set<string>): string {
  const sorted = [...names].sort();
  return sorted.length === 0 ? DASH : sorted.length <= 8 ? sorted.join(", ") : `${sorted.slice(0, 8).join(", ")} 외 ${sorted.length - 8}개`;
}

/** `## 독립 채점` — 독립 채점기·타입 검사 기록이 있을 때만 */
export function independentSection(result: BenchResult): string[] {
  const indep = hasIndependent(result);
  const typed = hasTypeCheck(result);
  if (!indep && !typed) return [];
  const lines: string[] = ["## 독립 채점", ""];
  const conds = displayConditions(result);
  const has = (c: Condition): boolean => result.conditions.includes(c);
  const cell = (c: Condition, f: (runs: RunRecord[]) => string): string => (has(c) ? f(runsOf(result, c)) : DASH);
  const cells = (f: (runs: RunRecord[]) => string): string[] => conds.map((c) => cell(c, f));

  if (indep) {
    lines.push(
      "dsmith의 규칙 엔진·`@dsmith-dev/*` 코드를 쓰지 않는 별도 채점기(`benchmarks/src/independent/`)가 같은 산출물에서 센 값이다. 에이전트가 새로 만든 등장만 센다(수정 파일은 before 대비 다중집합 차). 독립 사용률 = 정의된 var 참조 / (정의된 var + 정의 없는 var + 색 리터럴 + px·rem 길이 리터럴 + Tailwind 기본 팔레트·스케일).",
      "",
    );
    const rows: [string, (s: IndepSums) => string][] = [
      ["독립 사용률", (s) => ratioCell(s.varDefined, indepDen(s))],
      ["정의된 var 참조", (s) => String(s.varDefined)],
      ["정의 없는 var 참조", (s) => String(s.varUndefined)],
      ["색 리터럴", (s) => String(s.colorLiterals)],
      ["길이 리터럴(px·rem)", (s) => String(s.lengthLiterals)],
      ["Tailwind 기본 팔레트·스케일", (s) => String(s.tailwindPalette)],
      ["DS 모듈 컴포넌트(JSX)", (s) => String(s.dsComponents)],
      ["그 밖의 로컬 컴포넌트(JSX)", (s) => String(s.otherLocalComponents)],
      ["파싱 실패", (s) => String(s.parseFailed)],
      ["정의 없는 var 이름", (s) => listNames(s.undefinedNames)],
    ];
    const tableRows = rows.map(([label, f]) => [label, ...cells((r) => f(indepSums(r)))]);
    if (typed) {
      tableRows.push(
        ["타입 오류(바뀐 파일)", ...cells((r) => String(typeSums(r).errors))],
        ["타입 오류가 있는 실행", ...cells((r) => `${typeSums(r).runsWithErrors}/${typeSums(r).checkedRuns}`)],
        ["검사 방식", ...cells((r) => typeSums(r).modes.join(", ") || DASH)],
      );
    }
    if (result.repeat > 1) {
      tableRows.push(["독립 사용률 (반복 평균, 최소–최대)", ...conds.map((c) => metricCell(result, c, "indepUsage", "pct"))]);
      if (typed) tableRows.push(["타입 오류 (반복당 평균, 최소–최대)", ...conds.map((c) => metricCell(result, c, "typeErrors", "count"))]);
    }
    lines.push(...table(["지표", ...conds], tableRows), "");

    // 프롬프트별: 지표별로 조건 열을 묶는다
    const perPrompt = promptIds(result).map((id) => {
      const pooled = (c: Condition, metric: MetricId): number | null => metricOfSums(result.runs.filter((r) => r.prompt === id && r.condition === c).map(sumsOf), metric);
      const sums = (c: Condition) => indepSums(result.runs.filter((r) => r.prompt === id && r.condition === c));
      return [
        id,
        ...conds.map((c) => pct(pooled(c, "indepUsage"))),
        ...conds.map((c) => String(sums(c).varUndefined)),
        ...conds.map((c) => (typed ? num(pooled(c, "typeErrors"), 0) : DASH)),
      ];
    });
    lines.push(
      ...table(["id", ...conds.map((c) => `${c} 독립 사용률`), ...conds.map((c) => `${c} 정의 없는 var`), ...conds.map((c) => `${c} 타입 오류`)], perPrompt),
      "",
      "프롬프트별 값은 그 프롬프트의 모든 반복을 합산했다.",
      "",
    );

    const pairs = comparisons(result);
    if (pairs.length > 0) {
      const legacy = isLegacyConditions(result);
      for (const [ref, cmp] of pairs) {
        lines.push(...pairedStatLines(pairedAnalysis(result, "indepUsage", ref, cmp), legacy ? "독립 사용률" : `독립 사용률 (${cmp} − ${ref})`, "pct", true));
      }
      lines.push("");
      const rho = (r: { rho: number | null; n: number }): string => (r.rho === null ? `${DASH} (n=${r.n})` : `${r.rho.toFixed(2)} (n=${r.n})`);
      const totalsOf = agreementOf(result, pairs[0]?.[0], pairs[0]?.[1]).nonDsTotals;
      const totals = (c: Condition): string => {
        const t = totalsOf[c];
        return t === undefined ? DASH : `${t.dsmith} vs ${t.independent}`;
      };
      const nonDsDef = "DS 외 컴포넌트(dsmith `prefer-ds-component`) vs 그 밖의 로컬 컴포넌트(독립, 가져온 로컬 JSX 요소 중 DS 모듈이 아닌 것)";
      const definition = "- 두 지표는 정의가 다르다: dsmith는 \"DS에 대체 컴포넌트가 있는 로컬 컴포넌트\"만 세고, 독립 채점은 DS가 아닌 로컬 컴포넌트를 모두 센다. 값이 어긋나는 것이 곧 오류는 아니다.";
      lines.push("### 일치도", "");
      if (legacy) {
        const a = agreementOf(result);
        lines.push(
          `- 프롬프트별 방향(dsmith 토큰 사용률 차이 vs 독립 사용률 차이): 일치 ${a.agree} · 불일치 ${a.disagree} · 판정 불가 ${a.undetermined}(한쪽이 분모 0이거나 차이 0)`,
          `- 실행 단위 스피어만 ρ(토큰 사용률, 독립 사용률): ${rho(a.rhoUsage)}`,
          `- ${nonDsDef} 합계: baseline ${totals("baseline")} · dsmith ${totals("dsmith")}. 같은 값인 실행 ${a.nonDsEqual.equal}/${a.nonDsEqual.n}, 스피어만 ρ ${rho(a.rhoNonDs)}`,
          definition,
          "",
        );
      } else {
        for (const [ref, cmp] of pairs) {
          const a = agreementOf(result, ref, cmp);
          lines.push(
            `- ${cmp} − ${ref}: 프롬프트별 방향(dsmith 토큰 사용률 차이 vs 독립 사용률 차이) 일치 ${a.agree} · 불일치 ${a.disagree} · 판정 불가 ${a.undetermined}. 실행 단위 스피어만 ρ(토큰 사용률, 독립 사용률) ${rho(a.rhoUsage)}. DS 외 vs 그 밖의 로컬 컴포넌트가 같은 값인 실행 ${a.nonDsEqual.equal}/${a.nonDsEqual.n}, 스피어만 ρ ${rho(a.rhoNonDs)}`,
          );
        }
        lines.push(`- ${nonDsDef} 합계: ${conds.map((c) => `${c} ${totals(c)}`).join(" · ")}`, definition, "");
      }
    }
  } else {
    lines.push("독립 채점기 기록이 없다(이전 형식의 결과 JSON).", "");
  }

  if (typed) {
    const modes = [...new Set(result.runs.flatMap((r) => (r.typeCheck === undefined ? [] : [r.typeCheck.mode])))].sort();
    lines.push(
      `**타입 검사**(${modes.join(", ")}): 에이전트가 바꾼 ts·tsx·js·jsx 파일의 구문·의미 진단 중 그 파일 안에 있는 오류만 센다. 외부 패키지(react 등)의 타입은 복사본에 설치돼 있지 않아 풀지 못하고 any로 취급한다 — 외부 API 오용, JSX 내장 요소 속성 오타, \`React.FC<P>\`로 선언한 컴포넌트의 props는 못 잡고, 없는 로컬 모듈·없는 export·함수 선언 로컬 컴포넌트의 props 불일치·타입 불일치·구문 오류는 잡는다.`,
      "",
    );
    const withErrors = result.runs.filter((r) => (r.typeCheck?.typeErrors ?? 0) > 0);
    if (withErrors.length > 0) {
      const first = withErrors.slice(0, 5).flatMap((r) => (r.typeCheck?.diagnostics.slice(0, 1) ?? []).map((d) => `\`${r.condition}/${r.prompt}#${r.rep}\` ${d.file}:${d.line} TS${d.code} ${d.message}`));
      lines.push("타입 오류 예(앞 5개 실행의 첫 진단):", "", ...first.map((f) => `- ${f}`), "");
    }
  }
  return lines;
}

/** `## 해석 한계` 본문(제목 제외) */
export function limitLines(result: BenchResult, originLine: string | string[]): string[] {
  const n = result.prompts.length;
  const k = result.repeat;
  const legacy = isLegacyConditions(result);
  const pairs = comparisons(result);
  const both = pairs.length > 0;
  const indep = hasIndependent(result);
  const typed = hasTypeCheck(result);
  const out: string[] = [];

  out.push("**이번 보고서에서 다룬 것**");
  out.push(
    k > 1
      ? `- 반복 ${k}회: 프롬프트·조건별 평균과 최소–최대를 \`## 반복 통계\`에 싣고, \`## 대응 비교\`에서 프롬프트 ${n}개를 단위로 부호 검정(양쪽 정확 p)과 평균 차이의 95% 부트스트랩 CI(시드 고정)를 낸다. 에이전트 출력의 실행 간 변동은 반복 범위 안에서만 본 것이다.`
      : `- 반복 1회의 단일 측정이다. \`## 대응 비교\`의 부호 검정은 프롬프트 ${n}개 사이의 방향 일관성만 보고, 같은 프롬프트를 다시 돌렸을 때의 변동(에이전트의 비결정성)은 재지 못한다. \`--repeat 3\` 이상으로 돌려야 반복 통계가 생긴다.`,
  );
  if (both) out.push(`- 표본 단위는 프롬프트다. 프롬프트 수가 작아(N=${n}) 검정력이 낮고, 프롬프트는 이 하네스에 들어 있는 UI 생성 요청이라 "일반 UI 생성"으로 확장하지 못한다.`);
  out.push(
    indep
      ? "- 채점 독립성: dsmith 엔진과 코드를 공유하지 않는 별도 채점기가 같은 산출물을 다시 셌고(`## 독립 채점`), dsmith 점수와의 방향 일치도를 `### 일치도`에 밝혔다. 다만 독립 채점기도 같은 저자가 쓴 정규식·AST 휴리스틱이라 완전한 제3자 평가는 아니고, 베이스의 토큰·프리셋 정의는 같은 것을 읽고, DS 모듈 목록도 dsmith 스냅샷(`ds.modules`)에서 받는다."
      : "- 독립 채점기 기록이 없는 결과(이전 형식)다. 채점은 dsmith 자신의 규칙 엔진뿐이고 dsmith 조건의 에이전트는 같은 엔진(`lint_snippet`)을 쓸 수 있어, 같은 기준에 맞추도록 돕는 효과를 잰 것이지 독립 평가가 아니다.",
  );
  out.push(
    typed
      ? "- 타입 검사: 바뀐 파일을 TypeScript 컴파일러로 검사했다(위 \"타입 검사\" 문단에 방식과 못 잡는 것을 적었다). 토큰 정의 확인은 정의 없는 var 참조 수(`undefinedVars`)로 한다."
      : "- 타입 검사·토큰 정의 검사 기록이 없는 결과(이전 형식)다.",
  );
  out.push("", "**남은 한계**");
  out.push("- 렌더링하지 않았다. 화면에서 어떻게 보이는지(색 대비·레이아웃 깨짐)와 `tokens.css`가 실제로 로드되는지는 측정 밖이다 — 정의된 var 참조는 \"CSS 어딘가에 선언돼 있다\"까지만 확인한다.");
  if (!typed || result.runs.some((r) => r.typeCheck?.mode === "구문·의미 검사(의존성 타입 없이)")) {
    out.push("- 타입 검사는 의존성 타입 없이 했다(복사본에 node_modules 없음). react 등 외부 패키지 API 사용과 JSX 내장 요소 속성의 타입 오류는 검사 밖이다.");
  }
  out.push("- 모델 하나·에이전트 하나(관측 모델: " + (result.agent.models.length === 0 ? "기록 없음" : result.agent.models.join(", ")) + "), 레포 하나(" + result.repo + ")다. 다른 모델·에이전트·코드베이스로 일반화하지 못한다.");
  if (legacy) {
    out.push("- dsmith 조건의 개선이 AGENTS.md DS 섹션 때문인지 MCP 도구(`lint_snippet` 등) 때문인지 분리하지 않았다(AGENTS.md DS 섹션·`.mcp.json`·`.dsmith/`·`.claude/skills`가 함께 켜진 조건 하나뿐). MCP 호출 수를 요약에 싣지만 그것만으로 원인을 가르지 못한다.");
  } else {
    out.push(
      "- 2×2 분리: agents-only는 AGENTS.md DS 섹션과 `.dsmith/`만, mcp-only는 `.mcp.json`과 `.dsmith/`만 갖고, `.claude/skills`는 dsmith 조건에만 있다. 그래서 dsmith와 단일 요소 조건의 차이에는 스킬이 섞이고, agents-only의 AGENTS.md는 등록되지 않은 MCP 도구를 언급하며, mcp-only는 AGENTS.md 안내 없이 서버가 노출하는 도구 설명만 본다. 에이전트 명령은 네 조건이 같다(`--allowedTools mcp__dsmith` 포함). 요약의 `MCP 도구 호출`은 agents-only에서 0이어야 하고, mcp-only·dsmith에서 0이면 개선이 도구 호출에서 오지 않은 것이다. 두 요소의 상호작용은 네 조건의 차이로만 읽을 수 있다.",
    );
  }
  const mergedNote = mergedLine(result);
  if (mergedNote !== null) out.push(mergedNote);
  if (both) {
    const m = indep ? 4 : 3;
    const total = m * pairs.length;
    const bonf = (p: number | null): string => (p === null ? DASH : pValue(Math.min(1, p * total)));
    const usage = pairedAnalysis(result, "usage", pairs[0]?.[0], pairs[0]?.[1]);
    const nonDs = pairedAnalysis(result, "nonDs", pairs[0]?.[0], pairs[0]?.[1]);
    if (legacy) {
      out.push(
        `- 대응 비교에서 지표 ${m}개(토큰 사용률·DS 외 컴포넌트·DS 컴포넌트 사용${indep ? "·독립 사용률" : ""})를 각각 검정했고 다중 비교 보정은 하지 않았다. 참고로 Bonferroni(×${m})를 적용하면 토큰 사용률 p=${bonf(usage.sign.p)}, DS 외 컴포넌트 p=${bonf(nonDs.sign.p)}다.`,
      );
    } else {
      const usageBonf = pairs.map(([ref, cmp]) => `${cmp} − ${ref} p=${bonf(pairedAnalysis(result, "usage", ref, cmp).sign.p)}`).join(", ");
      out.push(
        `- 대응 비교에서 쌍 ${pairs.length}개 × 지표 ${m}개(토큰 사용률·DS 외 컴포넌트·DS 컴포넌트 사용${indep ? "·독립 사용률" : ""})를 각각 검정했고 다중 비교 보정은 하지 않았다. 참고로 Bonferroni(×${total})를 적용하면 토큰 사용률의 부호 검정 p는 ${usageBonf}다.`,
      );
    }
    out.push(
      `- 95% CI는 프롬프트 ${n}개의 백분위 부트스트랩이라 표본이 작으면 실제 포함 확률이 95%보다 낮을 수 있다. 그래서 같은 차이의 t 구간을 \`## 대응 비교\`에 함께 적었다(정규 근사를 가정한 비교용 값).`,
    );
    for (const [ref, cmp] of pairs) {
      const rows = pairedAnalysis(result, "usage", ref, cmp).rows;
      const negatives = rows.filter((r) => r.diff !== null && r.diff < 0);
      if (negatives.length > 0) {
        const detail = negatives
          .map((r) => `\`${r.prompt}\`(${pct(r.baseline?.mean)} → ${pct(r.dsmith?.mean)}, ${cmp} DS 컴포넌트 사용 평균 ${num(perPromptSummary(result, r.prompt, cmp, "dsUses")?.mean, 1)})`)
          .join(", ");
        out.push(
          `- 토큰 사용률이 ${cmp} 쪽에서 ${legacy ? "" : `${ref}보다 `}오히려 낮아진 프롬프트: ${detail}. 사용률은 직접 쓴 스타일 값 중 토큰 참조의 비율이라, DS 컴포넌트로 조립하고 레이아웃용 기본 스케일 클래스만 몇 개 직접 쓰면 분자가 0이 돼 0%가 된다. 이는 지표의 한계이며 이런 프롬프트의 DS 활용은 \`DS 컴포넌트 사용\` 행에서 따로 본다.`,
        );
      }
    }
  }
  out.push("- 준수율 분모에서 Tailwind 기본 스케일 클래스는 뺐다(별도 행).");
  out.push("- 변수·상수에 담은 className은 dynamic으로만 세며 준수율 분모에 들어가지 않음.");
  out.push(...(Array.isArray(originLine) ? originLine : [originLine]));
  return out;
}

/** 병합 결과에서 조건별 측정일·버전이 다르면 그 목록. 같으면(또는 병합이 아니면) null */
function mergedLine(result: BenchResult): string | null {
  const src = result.merged;
  if (src === undefined || src.length < 2) return null;
  const key = (s: MergedSource): string => `${s.date}|${s.agentVersion ?? ""}|${s.dsmith.version}|${s.dsmith.commit ?? ""}`;
  if (new Set(src.map(key)).size < 2) return null;
  const datesDiffer = new Set(src.map((s) => s.date)).size > 1;
  const detail = src
    .map((s) => `${s.conditions.join("·")} ${s.date}(에이전트 ${s.agentVersion ?? DASH}, 관측 모델 ${s.models.length === 0 ? DASH : s.models.join("·")}, dsmith ${s.dsmith.version} ${s.dsmith.commit === null ? DASH : s.dsmith.commit.slice(0, 7)})`)
    .join("; ");
  return `- ${datesDiffer ? "조건별 측정일이 다름" : "조건별 에이전트·dsmith 버전이 다름"}: ${detail}. 베이스 스냅샷·프롬프트·에이전트 명령은 같지만 서로 다른 시점의 실행이라 모델 응답의 시점 변화나 에이전트 업데이트를 조건 효과와 분리하지 못한다.`;
}

/**
 * 2×2 분리 README 줄용: 조건별 토큰 사용률 평균(프롬프트별 반복 평균의 평균).
 * 네 조건이 모두 있어야 하고, 네 조건 모두에서 사용률이 정의된 프롬프트만 쓴다(조건끼리 같은 프롬프트 집합). 아니면 null.
 */
export function ablationUsageMeans(result: BenchResult): { means: Record<Condition, number>; prompts: number } | null {
  if (!CONDITIONS.every((c) => result.conditions.includes(c))) return null;
  const common = promptIds(result).filter((id) => CONDITIONS.every((c) => perPromptSummary(result, id, c, "usage") !== null));
  if (common.length === 0) return null;
  const meanOf = (c: Condition): number => common.reduce((a, id) => a + (perPromptSummary(result, id, c, "usage")?.mean ?? 0), 0) / common.length;
  return { means: { baseline: meanOf("baseline"), "agents-only": meanOf("agents-only"), "mcp-only": meanOf("mcp-only"), dsmith: meanOf("dsmith") }, prompts: common.length };
}

/** README 줄용 요약: 반복이 2회 이상일 때만 쓴다 */
export function statsLineParts(result: BenchResult): { usage: string; nonDs: string; extra: string[] } | null {
  if (result.repeat <= 1) return null;
  const extra: string[] = [];
  if (hasIndependent(result)) {
    // 두 사용률 모두 프롬프트별 반복 평균을 대응시킨 평균이다(합산 비율이 아니다)
    const ind = pairedAnalysis(result, "indepUsage");
    if (ind.n > 0 && ind.meanDiff !== null && ind.meanBaseline !== null && ind.meanDsmith !== null && ind.ci !== null) {
      extra.push(
        `독립 채점기 기준 사용률 평균 ${pct(ind.meanBaseline)} → ${pct(ind.meanDsmith)} (${pp(ind.meanDiff)}, 95% CI [${ppNum(ind.ci.lo)}, ${ppNum(ind.ci.hi)}], 부호 검정 p=${pValue(ind.sign.p)})`,
      );
    }
  }
  if (hasTypeCheck(result)) {
    extra.push(`타입 오류 ${typeSums(runsOf(result, "baseline")).errors} → ${typeSums(runsOf(result, "dsmith")).errors}`);
  }
  const usage = pairedAnalysis(result, "usage");
  const nonDs = pairedAnalysis(result, "nonDs");
  const series = (c: Condition): number | null => {
    const v = perRepeatSeries(result, c, "nonDs");
    return summarize(v)?.mean ?? null;
  };
  const u =
    usage.n === 0 || usage.meanDiff === null || usage.meanBaseline === null || usage.meanDsmith === null || usage.ci === null
      ? DASH
      : `토큰 사용률 평균 ${pct(usage.meanBaseline)} → ${pct(usage.meanDsmith)} (차이 ${pp(usage.meanDiff)}, 95% CI [${ppNum(usage.ci.lo)}, ${ppNum(usage.ci.hi)}], 부호 검정 p=${pValue(usage.sign.p)})`;
  const b = series("baseline");
  const d = series("dsmith");
  const n =
    b === null || d === null ? DASH : `DS 외 컴포넌트 반복당 합계 ${num(b, 1)} → ${num(d, 1)} (프롬프트 단위 부호 검정 n=${nonDs.sign.n}, p=${pValue(nonDs.sign.p)})`;
  return { usage: u, nonDs: n, extra };
}

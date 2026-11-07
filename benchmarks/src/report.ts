import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { DASH, byCodeUnit, esc, ratioCell, table } from "./format.js";
import { CONDITIONS } from "./model.js";
import { MONOREPO_ROOT } from "./paths.js";
import type { Aggregate, BenchResult, Condition, RunRecord } from "./model.js";
import { independentSection, limitLines, pairedSection, repeatSection, statsLineParts } from "./sections.js";

function summaryRows(agg: Partial<Record<Condition, Aggregate>>): string[][] {
  const cell = (c: Condition, f: (a: Aggregate) => string): string => {
    const a = agg[c];
    return a === undefined ? DASH : f(a);
  };
  const row = (label: string, f: (a: Aggregate) => string): string[] => [
    label,
    cell("baseline", f),
    cell("dsmith", f),
  ];
  return [
    row("토큰 준수율", (a) => ratioCell(a.token, a.token + a.hardcoded)),
    row("토큰 사용률", (a) => ratioCell(a.token, a.token + a.hardcoded + a.tailwindDefault)),
    row("token(known)", (a) => `${a.token} (${a.knownToken})`),
    row("hardcoded(대체 가능)", (a) => `${a.hardcoded} (${a.replaceable})`),
    row("Tailwind 기본 스케일", (a) => String(a.tailwindDefault)),
    row("dynamic", (a) => String(a.dynamic)),
    row("DS 외 컴포넌트", (a) => String(a.nonDs)),
    row("DS 컴포넌트 사용", (a) => String(a.dsComponentUses)),
    row("deprecated", (a) => String(a.deprecated)),
    row("파싱 실패", (a) => String(a.parseFailed)),
    row("기대 파일 없음", (a) => String(a.missingExpected)),
    row("MCP 도구 호출", (a) => (a.mcpToolCalls === null || a.mcpToolCalls === undefined ? DASH : String(a.mcpToolCalls))),
    row("permission denial", (a) => (a.permissionDenials === null || a.permissionDenials === undefined ? DASH : String(a.permissionDenials))),
  ];
}

interface Sums {
  token: number;
  hardcoded: number;
  tailwindDefault: number;
  dynamic: number;
  nonDs: number;
  /** 메타가 하나도 없으면 null */
  mcpToolCalls: number | null;
  permissionDenials: number | null;
}

function sumRuns(runs: RunRecord[]): Sums | null {
  if (runs.length === 0) return null;
  const s: Sums = { token: 0, hardcoded: 0, tailwindDefault: 0, dynamic: 0, nonDs: 0, mcpToolCalls: null, permissionDenials: null };
  for (const r of runs) {
    s.token += r.score.totals.token;
    s.hardcoded += r.score.totals.hardcoded;
    s.tailwindDefault += r.score.totals.tailwindDefault;
    s.dynamic += r.score.totals.dynamic;
    s.nonDs += r.score.totals.nonDs;
    const mcp = r.agentMeta?.mcpToolCalls;
    if (mcp !== undefined) s.mcpToolCalls = (s.mcpToolCalls ?? 0) + mcp;
    const denied = r.agentMeta?.permissionDenials;
    if (denied !== undefined) s.permissionDenials = (s.permissionDenials ?? 0) + denied;
  }
  return s;
}

function complianceOf(s: Sums | null): number | null {
  if (s === null || s.token + s.hardcoded === 0) return null;
  return s.token / (s.token + s.hardcoded);
}

type Verdict = "개선" | "같음" | "악화" | "비교 불가";

function verdictOf(base: Sums | null, ds: Sums | null): Verdict {
  const b = complianceOf(base);
  const d = complianceOf(ds);
  if (b === null || d === null) return "비교 불가";
  // 소수 4자리로 맞춰 비교한다(집계 값과 같은 정밀도)
  const rb = Math.round(b * 10_000);
  const rd = Math.round(d * 10_000);
  return rd > rb ? "개선" : rd < rb ? "악화" : "같음";
}

const CONDITION_COLUMNS = ["준수율", "token/hardcoded/기본", "dynamic", "DS 외", "MCP/거부"] as const;

function condCells(s: Sums | null): string[] {
  if (s === null) return CONDITION_COLUMNS.map(() => DASH);
  const mcp = s.mcpToolCalls === null && s.permissionDenials === null ? DASH : `${s.mcpToolCalls ?? DASH}/${s.permissionDenials ?? DASH}`;
  return [ratioCell(s.token, s.token + s.hardcoded), `${s.token}/${s.hardcoded}/${s.tailwindDefault}`, String(s.dynamic), String(s.nonDs), mcp];
}

function runCountsLine(runs: RunRecord[]): string {
  const count = (status: RunRecord["status"]): number => runs.filter((r) => r.status === status).length;
  let line = `총 ${runs.length} · 성공 ${count("ok")} · 실패 ${count("agent-error")} · timeout ${count("timeout")} · missing ${count("missing")}`;
  const replay = count("replay");
  if (replay > 0) line += ` · 재생 ${replay}`;
  const harness = count("harness-error");
  if (harness > 0) line += ` · harness-error ${harness}`;
  return line;
}

/** 옛 결과 JSON에는 status가 없다 → complete */
const isAborted = (result: BenchResult): boolean => result.status === "aborted";

function totalCost(result: BenchResult): string {
  let sum: number | null = null;
  for (const c of CONDITIONS) {
    const cost = result.aggregate[c]?.costUsd;
    if (cost !== null && cost !== undefined) sum = (sum ?? 0) + cost;
  }
  return sum === null ? DASH : sum.toFixed(2);
}

/** 결정적 마크다운. 숫자는 result 값만 */
export function renderReport(result: BenchResult, opts: { recordPath?: string } = {}): string {
  const lines: string[] = [];
  const n = result.prompts.length;
  const seen = result.runs.filter((r) => r.harnessPathSeen).length;
  const commit = result.dsmith.commit === null ? DASH : result.dsmith.commit.slice(0, 7);

  lines.push(`# 벤치마크 결과 — ${result.repo} (${result.date})`, "");
  lines.push(
    ...table(
      ["항목", "값"],
      [
        ["모드", result.mode],
        ["프롬프트 수 N", String(n)],
        ["조건", result.conditions.join(", ")],
        ["반복", String(result.repeat)],
        ["에이전트 명령", result.agent.command === null ? DASH : `\`${esc(result.agent.command)}\``],
        ["에이전트 버전", result.agent.version ?? DASH],
        ["관측 모델", result.agent.models.length === 0 ? DASH : result.agent.models.join(", ")],
        ["dsmith 버전·커밋", `${result.dsmith.version} · ${commit}`],
        ["베이스 토큰 수", String(result.base.tokens)],
        ["베이스 DS 컴포넌트 수", String(result.base.dsComponents)],
        ["스냅샷 sha256", result.base.snapshotSha256.slice(0, 12)],
        ["실행 수", runCountsLine(result.runs)],
        ["상태", isAborted(result) ? `aborted — ${result.abortReason ?? "이유 기록 없음"}` : "complete"],
        ["총비용(USD)", totalCost(result)],
        ["harnessPathSeen 실행 수", String(seen)],
      ],
    ),
    "",
  );
  if (isAborted(result)) {
    const planned = result.prompts.length * result.conditions.length * result.repeat;
    lines.push(`**경고:** 중단된 결과다(${result.abortReason ?? "이유 기록 없음"}). 계획한 실행 ${planned}개 중 ${result.runs.length}개만 집계했다.`, "");
  }
  if (seen > 0) {
    lines.push(
      `**경고:** ${seen}개 실행의 에이전트 출력에서 채점 코드 경로(\`benchmarks\`)가 보였다. 해당 실행은 오염됐을 수 있다.`,
      "",
    );
  }

  lines.push("## 요약", "", ...table(["지표", "baseline", "dsmith"], summaryRows(result.aggregate)), "");

  const ids = [...new Set([...result.prompts.map((p) => p.id), ...result.runs.map((r) => r.prompt)])].sort(byCodeUnit);
  const fileOf = new Map(result.prompts.map((p) => [p.id, p.file]));
  const tally: Record<Verdict, number> = { 개선: 0, 같음: 0, 악화: 0, "비교 불가": 0 };
  const promptRows: string[][] = [];
  for (const id of ids) {
    const base = sumRuns(result.runs.filter((r) => r.prompt === id && r.condition === "baseline"));
    const ds = sumRuns(result.runs.filter((r) => r.prompt === id && r.condition === "dsmith"));
    const verdict = verdictOf(base, ds);
    tally[verdict] += 1;
    promptRows.push([id, fileOf.get(id) ?? DASH, ...condCells(base), ...condCells(ds), verdict]);
  }
  lines.push(
    "## 프롬프트별",
    "",
    ...table(
      ["id", "파일", ...CONDITIONS.flatMap((c) => CONDITION_COLUMNS.map((col) => `${c} ${col}`)), "판정"],
      promptRows,
    ),
    "",
    `개선 ${tally["개선"]} · 같음 ${tally["같음"]} · 악화 ${tally["악화"]} · 비교 불가 ${tally["비교 불가"]}`,
    "",
  );

  lines.push(...repeatSection(result), ...pairedSection(result), ...independentSection(result));

  const recordPath = opts.recordPath ?? `benchmarks/results/${result.date}-${result.repo}/outputs`;
  lines.push("## 해석 한계", "", ...limitLines(result, originLine(result, recordPath)), "");
  return lines.join("\n");
}

function originLine(result: BenchResult, recordPath: string): string {
  if (result.mode !== "replay") {
    return `- 산출물은 \`${recordPath}\`에 있고 저장소 루트에서 \`pnpm bench --repo ${result.repo} --replay ${recordPath}\`로 같은 채점을 다시 낼 수 있다.`;
  }
  switch (result.replaySource) {
    case "synthetic":
      return "- 합성 산출물 — 실측 아님. 채점 파이프라인 검증용이며 성능 주장에 쓰지 않는다.";
    case "agent":
      return "- 실제 에이전트 실행의 산출물을 다시 채점한 결과(replay)다. 에이전트는 호출하지 않았다.";
    default:
      return "- replay 산출물의 출처가 기록되지 않았다(meta.json 없음). 실측 결과로 쓰지 않는다.";
  }
}

/**
 * README 상단 한 줄(README.md의 `<!-- bench:line -->` 아래 줄과 글자 그대로 같다). 한 줄.
 * replay 결과이거나 조건이 하나뿐이면 Error.
 */
export function readmeLine(result: BenchResult, mdPath: string): string {
  if (result.mode === "replay") throw new Error("replay 결과로는 README 줄을 만들지 않음");
  if (isAborted(result)) throw new Error(`중단된 결과로는 README 줄을 만들지 않음: ${result.abortReason ?? "이유 기록 없음"}`);
  const base = result.aggregate.baseline;
  const ds = result.aggregate.dsmith;
  if (base === undefined || ds === undefined) throw new Error("README 줄에는 baseline과 dsmith 조건이 둘 다 필요함");
  if (result.agent.command === null) throw new Error("에이전트 명령이 없는 결과로는 README 줄을 만들지 않음");
  const label = result.agent.command.trim().split(/\s+/).slice(0, 2).join(" ");
  // 반복이 2회 이상이면 평균·CI·부호 검정 형식, 1회면 아래의 기존 형식 그대로
  const stats = statsLineParts(result);
  const link = `[${mdPath}](${mdPath})`;
  if (stats !== null) {
    return `벤치마크(프롬프트 ${result.prompts.length}개 × 조건 2 × 반복 ${result.repeat}, ${label}, ${result.date}): ${[stats.usage, stats.nonDs, ...stats.extra].join(", ")} — ${link}${LINE_TAIL}`;
  }
  return `벤치마크(프롬프트 ${result.prompts.length}개 × 조건 2, ${label}, ${result.date}): 토큰 준수율 ${ratioCell(base.token, base.token + base.hardcoded)} → ${ratioCell(ds.token, ds.token + ds.hardcoded)}, DS 외 컴포넌트 ${base.nonDs} → ${ds.nonDs} — ${link}${LINE_TAIL}`;
}

const LINE_TAIL = ". 렌더링은 하지 않았고 모델·레포 하나다(해석 한계는 보고서 참고).";

/** 모노레포 루트 기준 상대 경로(POSIX 구분자). 밖이면 `../…`로 시작한다 */
export function toPosixRelative(file: string): string {
  return path.relative(MONOREPO_ROOT, file).split(path.sep).join("/");
}

const USAGE ="사용법: pnpm bench:report --in <결과.json> [--out <보고서.md>]  (상대 경로는 명령을 실행한 폴더 기준)";

/**
 * 결과 JSON을 읽어 같은 이름의 .md를 쓰고 README 줄을 돌려준다.
 * `--`(pnpm 전달)는 몇 개든 무시하고, 상대 경로는 pnpm이 알려 주는 INIT_CWD(없으면 process.cwd()) 기준으로 푼다.
 */
export function reportFromFile(argv: string[], env: NodeJS.ProcessEnv = process.env): { mdFile: string; line: string | null } {
  const { values } = parseArgs({
    args: argv.filter((a) => a !== "--"),
    options: { in: { type: "string" }, out: { type: "string" } },
    strict: true,
  });
  if (values.in === undefined) throw new Error(USAGE);
  const cwd = env.INIT_CWD !== undefined && env.INIT_CWD !== "" ? env.INIT_CWD : process.cwd();
  const inFile = path.resolve(cwd, values.in);
  const result = JSON.parse(readFileSync(inFile, "utf8")) as BenchResult;
  if (result.version !== 1) throw new Error(`지원하지 않는 결과 형식: version ${String(result.version)}`);
  const mdFile = values.out === undefined ? inFile.replace(/\.json$/, "") + ".md" : path.resolve(cwd, values.out);
  mkdirSync(path.dirname(mdFile), { recursive: true });
  // 산출물 폴더는 run.ts의 effectiveRecord와 같은 규칙: <결과 JSON 이름>/outputs
  const record = path.join(path.dirname(inFile), path.basename(inFile, ".json"), "outputs");
  writeFileSync(mdFile, renderReport(result, { recordPath: toPosixRelative(record) }));
  let mdPath = toPosixRelative(mdFile);
  if (mdPath === ".." || mdPath.startsWith("../") || path.isAbsolute(mdPath)) {
    process.stderr.write(`경고: 보고서가 모노레포 밖(${mdFile})에 있어 README 줄에는 파일 이름만 쓴다\n`);
    mdPath = path.basename(mdFile);
  }
  let line: string | null = null;
  try {
    line = readmeLine(result, mdPath);
  } catch {
    line = null;
  }
  return { mdFile, line };
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { mdFile, line } = reportFromFile(process.argv.slice(2));
    process.stderr.write(`보고서: ${mdFile}\n`);
    if (line === null) process.stderr.write("README 줄: 만들지 않음(replay 결과, 중단된 결과이거나 조건이 하나뿐임)\n");
    else process.stdout.write(`${line}\n`);
  } catch (e) {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(2);
  }
}

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { localDate } from "@dsmith-dev/core";
import { agentEnv, agentVersion, parseAgentMeta, runAgent, type AgentRun } from "./agent.js";
import {
  CLI_BIN,
  MONOREPO_ROOT,
  REPOS,
  defaultInstallTool,
  makeRunCopy,
  prepareBase,
  prepareCondition,
  type RepoName,
} from "./base.js";
import { assertReplayDir, collectChanges, readReplay, readReplaySource, writeOutputs, writeReplayMeta } from "./collect.js";
import { CONDITIONS, type Aggregate, type BenchResult, type Condition, type ReplaySource, type RunRecord } from "./model.js";
import { metricOfSums, sumsOf } from "./analysis.js";
import { evaluateIndependent } from "./independent/index.js";
import { loadPrompts, type Prompt } from "./prompts.js";
import { renderReport } from "./report.js";
import { aggregate, scoreRun } from "./score.js";

/** `--agent "claude -p"` 약식은 결정 5의 전체 명령(부록 D.1)으로 펼친다. 그 밖의 문자열은 그대로 쓴다. */
export const CLAUDE_AGENT_COMMAND =
  "claude -p --output-format stream-json --verbose --model sonnet --max-turns 20 --max-budget-usd 0.5 --permission-mode acceptEdits --allowedTools mcp__dsmith --setting-sources project --no-session-persistence";

export interface BenchArgs {
  repo: RepoName;
  /** 정확히 하나: agent | replay */
  agent: string | null;
  replay: string | null;
  conditions: Condition[];
  repeat: number;
  prompts: string[] | null;
  out: string | null;
  record: string | null;
  timeoutSec: number;
  installTool: string | null;
  passEnv: string[];
  keep: boolean;
  date: string | null;
  agentVersion: string | null;
  dryRun: boolean;
  /** 누적 비용(USD)이 이 값을 넘으면 새 실행을 시작하지 않는다(agent 모드). null이면 실행 수에 맞춘 기본값(resolveLimits) */
  maxTotalUsd: number | null;
  /** 실패 실행(ok가 아닌 것)이 이 개수에 닿으면 새 실행을 시작하지 않는다(agent 모드). null이면 실행 수에 맞춘 기본값 */
  maxFailures: number | null;
}

/** 실측 프로브(결정 5, 부록 D.1)의 실행당 비용 추정 — 12×2×1 실측은 24회에 $1.79(평균 $0.075) */
export const COST_PER_RUN_USD = 0.075;

export function estimateCostUsd(plannedRuns: number): number {
  return Math.round(plannedRuns * COST_PER_RUN_USD * 100) / 100;
}

/**
 * 중단 기준. 명시한 값은 그대로 쓴다. 안 쓰면 실행 수에 맞춰 늘린다:
 *  - 비용 한도 = max(8, ceil(추정 비용 × 1.5)) — 24회(추정 $1.8)는 기존 $8, 72회(추정 $5.4)는 $9
 *  - 실패 한도 = max(6, ceil(실행 수 / 8)) — 24회는 6, 72회는 9
 */
export function resolveLimits(args: Pick<BenchArgs, "maxTotalUsd" | "maxFailures">, plannedRuns: number): { maxTotalUsd: number; maxFailures: number } {
  return {
    maxTotalUsd: args.maxTotalUsd ?? Math.max(8, Math.ceil(estimateCostUsd(plannedRuns) * 1.5)),
    maxFailures: args.maxFailures ?? Math.max(6, Math.ceil(plannedRuns / 8)),
  };
}

const USAGE = `사용법: pnpm bench (--agent "<명령>" | --replay <디렉터리> | --replay-set <이름>) [옵션]   (\`pnpm bench -- …\`도 같다)
  상대 경로(--out·--record·--replay)는 명령을 실행한 폴더 기준이다(pnpm이 알려 주는 INIT_CWD, 없으면 cwd).
  --repo <legacy-demo|with-ds-app>   대상 레포 (기본 legacy-demo)
  --agent "<명령>"                   프롬프트를 stdin으로 받는 에이전트 명령. "claude -p"만 쓰면 결정 5의 전체 명령으로 펼침 (--dry-run만 쓰면 이 명령의 계획)
  --replay <dir>                     <dir>/<조건>/<프롬프트 id>/<반복>/{files/…,run.json} 산출물을 채점만 한다(에이전트 호출 없음). 없는 폴더·조건 폴더가 없으면 종료 코드 2
  --replay-set <이름>                benchmarks/replay/<이름> (저장소에 들어 있는 합성 세트, 실행 폴더와 무관)
  --conditions baseline,dsmith       기본: 둘 다
  --repeat <1..10>                   기본 1
  --prompts <id,id>                  기본: 12개 전부
  --out <결과.json>                  agent 기본 benchmarks/results/<date>-<repo>.json, replay 기본: 파일 없이 요약만 출력. agent는 실행마다 갱신한다
  --record <dir>                     agent 산출물 디렉터리 (기본 <out 확장자 뺀 경로>/outputs, meta.json에 출처를 기록)
  --timeout <초>                     에이전트 한 번의 제한 (기본 600)
  --max-total-usd <n>                누적 비용이 n(USD)을 넘으면 새 실행을 시작하지 않고 aborted로 저장, 종료 코드 1 (기본 max(8, 추정 비용×1.5) — 24회 $8, 72회 $9)
  --max-failures <n>                 실패 실행이 n개가 되면 같은 방식으로 중단 (기본 max(6, 실행 수/8) — 24회 6, 72회 9)
  --install-tool <도구>              dsmith 조건의 install --tool (기본: 에이전트 명령에서 추정)
  --pass-env <NAME>                  에이전트에 추가로 넘길 환경 변수 (반복 가능, CLAUDE* 불가)
  --keep                             실행 복사본을 지우지 않고 경로를 출력
  --date <YYYY-MM-DD>                결과의 날짜 덮어쓰기
  --agent-version <문자열>           결과의 에이전트 버전 덮어쓰기(replay에서 기록용)
  --dry-run                          계획만 출력하고 아무것도 실행하지 않음`;

const splitList = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x !== "");

/** 명령을 실행한 폴더: pnpm이 설정하는 INIT_CWD, 없으면 process.cwd() */
export function callerCwd(env: NodeJS.ProcessEnv = process.env): string {
  const init = env.INIT_CWD;
  return init !== undefined && path.isAbsolute(init) ? init : process.cwd();
}

/**
 * node:util parseArgs. 잘못된 입력은 사용법을 담은 Error.
 * `--`(pnpm 전달)는 몇 개든, 어디에 있든 무시한다 — 루트 스크립트가 끝에 `--`를 붙이므로 `pnpm bench -- --repo x`는 `-- --`로 들어온다.
 * 경로 옵션의 상대 경로는 callerCwd 기준 절대 경로로 바꾼다(pnpm이 cwd를 benchmarks/로 옮기므로).
 */
export function parseBenchArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): BenchArgs {
  const fail = (why: string): never => {
    throw new Error(`${why}\n${USAGE}`);
  };
  const rest = argv.filter((a) => a !== "--");
  let values;
  try {
    ({ values } = parseArgs({
      args: rest,
      strict: true,
      allowPositionals: false,
      options: {
        repo: { type: "string" },
        agent: { type: "string" },
        replay: { type: "string" },
        "replay-set": { type: "string" },
        "max-total-usd": { type: "string" },
        "max-failures": { type: "string" },
        conditions: { type: "string" },
        repeat: { type: "string" },
        prompts: { type: "string" },
        out: { type: "string" },
        record: { type: "string" },
        timeout: { type: "string" },
        "install-tool": { type: "string" },
        "pass-env": { type: "string", multiple: true },
        keep: { type: "boolean" },
        date: { type: "string" },
        "agent-version": { type: "string" },
        "dry-run": { type: "boolean" },
      },
    }));
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }

  const repo = values.repo ?? "legacy-demo";
  if (!Object.hasOwn(REPOS, repo)) fail(`모르는 --repo: ${repo} (있는 것: ${Object.keys(REPOS).join(", ")})`);
  const agent = values.agent === undefined ? null : values.agent.trim();
  const resolve = (p: string): string => path.resolve(callerCwd(env), p);
  const replaySet = values["replay-set"];
  if (replaySet !== undefined && !/^\w[\w-]*$/.test(replaySet)) fail(`--replay-set은 benchmarks/replay 아래 폴더 이름이어야 합니다: ${replaySet}`);
  if (replaySet !== undefined && values.replay !== undefined) fail("--replay와 --replay-set은 함께 쓸 수 없습니다");
  const replay = replaySet !== undefined ? path.join(MONOREPO_ROOT, "benchmarks/replay", replaySet) : values.replay !== undefined ? resolve(values.replay) : null;
  if (agent !== null && replay !== null) fail("--agent와 --replay는 함께 쓸 수 없습니다");
  // --dry-run은 계획만 보여 주므로 --agent도 --replay도 없으면 기본 실측 명령(claude -p)의 계획을 보여 준다
  const dryRun = values["dry-run"] === true;
  if (agent === null && replay === null && !dryRun) fail("--agent 또는 --replay 중 하나가 필요합니다");
  if (agent === "") fail("--agent 명령이 비어 있습니다");

  const conditions: Condition[] = [];
  for (const c of splitList(values.conditions ?? CONDITIONS.join(","))) {
    const known = CONDITIONS.find((k) => k === c);
    if (known === undefined) return fail(`모르는 --conditions 값: ${c} (있는 것: ${CONDITIONS.join(", ")})`);
    if (!conditions.includes(known)) conditions.push(known);
  }
  if (conditions.length === 0) fail("--conditions가 비어 있습니다");
  conditions.sort((a, b) => CONDITIONS.indexOf(a) - CONDITIONS.indexOf(b));

  const repeat = values.repeat === undefined ? 1 : Number(values.repeat);
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 10) fail(`--repeat는 1..10 정수여야 합니다: ${values.repeat ?? ""}`);
  const timeoutSec = values.timeout === undefined ? 600 : Number(values.timeout);
  if (!Number.isFinite(timeoutSec) || timeoutSec <= 0) fail(`--timeout은 양수(초)여야 합니다: ${values.timeout ?? ""}`);
  const date = values.date ?? null;
  if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`--date는 YYYY-MM-DD 형식이어야 합니다: ${date}`);
  const prompts = values.prompts === undefined ? null : splitList(values.prompts);
  if (prompts !== null && prompts.length === 0) fail("--prompts가 비어 있습니다");
  const maxTotalUsd = values["max-total-usd"] === undefined ? null : Number(values["max-total-usd"]);
  if (maxTotalUsd !== null && (!Number.isFinite(maxTotalUsd) || maxTotalUsd <= 0)) fail(`--max-total-usd는 양수(USD)여야 합니다: ${values["max-total-usd"] ?? ""}`);
  const maxFailures = values["max-failures"] === undefined ? null : Number(values["max-failures"]);
  if (maxFailures !== null && (!Number.isInteger(maxFailures) || maxFailures < 1)) fail(`--max-failures는 1 이상의 정수여야 합니다: ${values["max-failures"] ?? ""}`);
  const passEnv = values["pass-env"] ?? [];
  for (const name of passEnv) agentEnv([name], {}); // CLAUDE* 이면 Error

  return {
    repo: repo as RepoName,
    agent: agent === null ? (replay === null ? CLAUDE_AGENT_COMMAND : null) : agent === "claude -p" ? CLAUDE_AGENT_COMMAND : agent,
    replay,
    conditions,
    repeat,
    prompts,
    out: values.out === undefined ? null : resolve(values.out),
    record: values.record === undefined ? null : resolve(values.record),
    timeoutSec,
    installTool: values["install-tool"] ?? null,
    passEnv,
    keep: values.keep === true,
    date,
    agentVersion: values["agent-version"] ?? null,
    dryRun: values["dry-run"] === true,
    maxTotalUsd,
    maxFailures,
  };
}

const PROMPTS_DIR = path.join(MONOREPO_ROOT, "benchmarks/prompts");

/** --prompts 순서와 무관하게 id 순(결정적 출력). 중복 id는 한 번만. */
async function promptsFor(ids: string[] | null): Promise<Prompt[]> {
  const loaded = await loadPrompts(PROMPTS_DIR, ids ?? undefined);
  const byId = new Map(loaded.map((p) => [p.id, p]));
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function effectiveOut(args: BenchArgs, date: string): string | null {
  if (args.out !== null) return path.resolve(args.out);
  if (args.agent !== null) return path.join(MONOREPO_ROOT, "benchmarks/results", `${date}-${args.repo}.json`);
  return null;
}

/** 결과 JSON 옆의 보고서 경로: 같은 이름, 확장자만 .md */
export function mdPathOf(out: string): string {
  return path.join(path.dirname(out), `${path.basename(out, path.extname(out))}.md`);
}

function effectiveRecord(args: BenchArgs, out: string | null): string | null {
  if (args.record !== null) return path.resolve(args.record);
  if (out === null) return null;
  return path.join(path.dirname(out), path.basename(out, path.extname(out)), "outputs");
}

/** `--dry-run`: 실행 계획 줄들. 아무 것도 준비·실행하지 않는다. */
export async function planBench(args: BenchArgs): Promise<string[]> {
  const date = args.date ?? localDate(new Date());
  const prompts = await promptsFor(args.prompts);
  const out = effectiveOut(args, date);
  const record = args.agent !== null ? effectiveRecord(args, out) : null;
  const total = prompts.length * args.conditions.length * args.repeat;
  const limits = resolveLimits(args, total);
  return [
    `모드: ${args.agent !== null ? "agent" : "replay"} · 레포: ${args.repo} (${REPOS[args.repo]})`,
    args.agent !== null ? `에이전트 명령: ${args.agent}` : `replay 디렉터리: ${path.resolve(args.replay ?? "")}`,
    ...(args.agent !== null ? [`install 도구: ${args.installTool ?? defaultInstallTool(args.agent)} · 제한시간 ${args.timeoutSec}초 · 넘기는 환경 변수: ${Object.keys(agentEnv(args.passEnv)).join(", ")}`] : []),
    `조건: ${args.conditions.join(", ")} · 반복: ${args.repeat} · 프롬프트 ${prompts.length}개: ${prompts.map((p) => p.id).join(", ")}`,
    `실행 수: ${total} (순차)`,
    ...(args.agent !== null
      ? [
          `예상 비용: 실행 ${total}회 × ~$${COST_PER_RUN_USD} ≈ $${estimateCostUsd(total)} (실측 프로브 평균, 실제는 달라질 수 있음)`,
          `중단 기준: 누적 $${limits.maxTotalUsd} 초과 또는 실패 ${limits.maxFailures}개 이상 — 넘으면 새 실행을 시작하지 않고 aborted로 저장${args.maxTotalUsd === null && args.maxFailures === null ? " (실행 수에 맞춘 기본값; --max-total-usd·--max-failures로 바꿈)" : ""}`,
          ...(estimateCostUsd(total) > limits.maxTotalUsd ? [`경고: 예상 비용 $${estimateCostUsd(total)}가 비용 한도 $${limits.maxTotalUsd}를 넘는다 — 끝까지 가기 전에 중단된다`] : []),
        ]
      : []),
    `결과 JSON: ${out ?? "(파일 없음 — 요약만 출력)"}`,
    ...(record !== null ? [`산출물(replay 배치): ${record}`] : []),
    `날짜: ${date}`,
  ];
}

function git(cwd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, encoding: "utf-8" }, (err, stdout) => resolve(err === null ? stdout.trim() : null));
  });
}

async function dsmithInfo(): Promise<BenchResult["dsmith"]> {
  const pkg: unknown = JSON.parse(await fs.readFile(path.join(MONOREPO_ROOT, "packages/cli/package.json"), "utf-8"));
  const version = typeof pkg === "object" && pkg !== null && "version" in pkg && typeof pkg.version === "string" ? pkg.version : "unknown";
  const commit = await git(MONOREPO_ROOT, ["rev-parse", "HEAD"]);
  return { version, commit: commit === "" ? null : commit };
}

const INTERIM_REASON = "실행이 끝나기 전의 중간 저장본(정상 종료하면 complete로 덮어씀)";

const usd = (n: number): string => `$${Math.round(n * 1_000_000) / 1_000_000}`;

/** 임시 파일에 쓰고 rename — 읽는 쪽이 반쯤 쓴 파일을 보지 않는다 */
async function writeFileAtomic(file: string, text: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  await fs.writeFile(tmp, text);
  await fs.rename(tmp, file);
}

/**
 * prepareBase → (agent) 조건별 템플릿 → 프롬프트 × 조건 × 반복 순차 실행 → 채점 → 집계.
 * 에이전트 실패·하네스 예외는 던지지 않고 기록한다(산출물은 그래도 채점). 베이스·템플릿은 finally에서 지운다.
 * agent 모드는 실행마다 결과 JSON을 갱신하고, 누적 비용이 maxTotalUsd를 넘거나 실패가 maxFailures에 닿으면 새 실행을 시작하지 않고 aborted로 마친다.
 */
export async function runBench(args: BenchArgs, log: (line: string) => void = () => undefined): Promise<BenchResult> {
  const date = args.date ?? localDate(new Date());
  const mode = args.agent !== null ? "agent" : "replay";
  const prompts = await promptsFor(args.prompts);
  const out = effectiveOut(args, date);
  const record = mode === "agent" ? effectiveRecord(args, out) : null;
  const replayDir = args.replay === null ? null : path.resolve(args.replay);
  // 잘못된 replay 경로는 베이스를 준비하기 전에, missing으로 뭉개지 않고 바로 알린다
  if (replayDir !== null) await assertReplayDir(replayDir, args.conditions);
  const replaySource: ReplaySource | null = replayDir === null ? null : await readReplaySource(replayDir);
  const env = agentEnv(args.passEnv);
  const installTool = args.agent !== null ? (args.installTool ?? defaultInstallTool(args.agent)) : args.installTool;
  const startedAt = mode === "agent" ? new Date().toISOString() : null;
  const dsmith = await dsmithInfo();
  const version = args.agentVersion ?? (args.agent !== null ? await agentVersion(args.agent, env) : null);

  log(`베이스 준비: ${args.repo}`);
  const base = await prepareBase(args.repo);
  const templates = new Map<Condition, string>();
  const runs: RunRecord[] = [];

  const buildResult = (status: BenchResult["status"], abortReason: string | null): BenchResult => {
    const agg: Partial<Record<Condition, Aggregate>> = {};
    for (const c of args.conditions) agg[c] = aggregate(runs.filter((r) => r.condition === c));
    const models = [...new Set(runs.flatMap((r) => r.agentMeta?.models ?? []))].sort();
    const result: BenchResult = {
      version: 1,
      date,
      startedAt,
      repo: args.repo,
      mode,
      agent: { command: args.agent, version, installTool: mode === "agent" ? installTool : null, models },
      dsmith,
      base: { tokens: base.snapshot.tokens.length, dsComponents: base.snapshot.ds.components.length, snapshotSha256: base.snapshotSha256 },
      prompts: prompts.map((p: Prompt) => ({ id: p.id, file: p.file, sha256: p.sha256 })),
      conditions: args.conditions,
      repeat: args.repeat,
      timeoutSec: mode === "agent" ? args.timeoutSec : null,
      status,
      abortReason,
      runs: [...runs],
      aggregate: agg,
    };
    if (replaySource !== null) result.replaySource = replaySource;
    return result;
  };

  try {
    if (args.agent !== null) {
      for (const c of args.conditions) {
        log(`조건 템플릿 준비: ${c}`);
        templates.set(c, await prepareCondition(base, c, installTool ?? "agents-md"));
      }
      if (record !== null) await writeReplayMeta(record, { source: "agent", repo: args.repo, date, agentVersion: version });
    }
    const harnessDir = path.join(MONOREPO_ROOT, "benchmarks");
    const jobs: { prompt: Prompt; condition: Condition; rep: number }[] = [];
    for (const prompt of prompts) for (const condition of args.conditions) for (let rep = 1; rep <= args.repeat; rep += 1) jobs.push({ prompt, condition, rep });

    const limits = resolveLimits(args, jobs.length);
    // 독립 채점·타입 검사: root는 에이전트 복사본(agent) 또는 replay의 베이스. DS 모듈은 스냅샷 값을 일반 데이터로 넘긴다
    const extrasOf = (root: string, changes: Parameters<typeof scoreRun>[0]["changes"]) =>
      evaluateIndependent({ root, changes, dsModules: base.snapshot.ds.modules });
    let spent = 0;
    let failures = 0;
    let abortReason: string | null = null;
    for (const { prompt, condition, rep } of jobs) {
      if (abortReason !== null) break;
      const label = `${prompt.id} · ${condition} · #${rep}`;
      const scoreOf = (changes: Parameters<typeof scoreRun>[0]["changes"]) =>
        scoreRun({ root: base.dir, snapshot: base.snapshot, matchers: base.matchers, changes, expectedFile: prompt.file });

      if (args.agent === null) {
        const r = await readReplay(replayDir ?? "", base, condition, prompt.id, rep);
        const rec: RunRecord = {
          prompt: prompt.id,
          condition,
          rep,
          status: r.run.status ?? "replay",
          exitCode: r.run.exitCode ?? null,
          durationMs: r.run.durationMs ?? null,
          agentMeta: r.run.agentMeta ?? null,
          harnessPathSeen: r.run.harnessPathSeen ?? false,
          score: scoreOf(r.changes),
          ...extrasOf(base.dir, r.changes),
        };
        runs.push(rec);
        log(`${label}: ${rec.status}`);
        continue;
      }

      let copy: string | undefined;
      let res: AgentRun | undefined;
      let rec: RunRecord;
      try {
        const template = templates.get(condition);
        if (template === undefined) throw new Error(`조건 템플릿이 없습니다: ${condition}`);
        copy = await makeRunCopy(template);
        log(`${label}: 실행`);
        res = await runAgent(args.agent, prompt.text, { cwd: copy, env, timeoutMs: args.timeoutSec * 1000 });
        const changes = await collectChanges(copy);
        const status: RunRecord["status"] = res.timedOut ? "timeout" : res.exitCode !== 0 ? "agent-error" : "ok";
        const harnessPathSeen = res.stdout.includes(harnessDir);
        const meta = parseAgentMeta(res.stdout);
        if (record !== null) {
          const transcript = path.join(path.dirname(record), "transcripts", condition, `${prompt.id}-${rep}.jsonl`);
          await fs.mkdir(path.dirname(transcript), { recursive: true });
          await fs.writeFile(transcript, res.stdout);
        }
        const meta0 = { status, exitCode: res.exitCode, durationMs: res.durationMs, agentMeta: meta, harnessPathSeen };
        if (record !== null) await writeOutputs(record, condition, prompt.id, rep, changes, meta0);
        // 복사본이 아직 있을 때(정리 전에) 독립 채점과 타입 검사를 한다
        rec = { prompt: prompt.id, condition, rep, ...meta0, score: scoreOf(changes), ...extrasOf(copy, changes) };
        log(`${label}: ${status} (${Math.round(res.durationMs / 100) / 10}s, 변경 ${changes.length}개${meta?.costUsd !== undefined ? `, $${meta.costUsd}` : ""})`);
        if (res.exitCode !== 0 && res.stderrTail.trim() !== "") log(`  stderr: ${res.stderrTail.trim().split("\n").slice(-3).join(" | ")}`);
      } catch (e) {
        // 하네스 예외 한 건이 전체 실행을 버리지 않게 기록하고 다음 실행으로 간다
        const message = e instanceof Error ? e.message : String(e);
        const failed = { status: "harness-error" as const, exitCode: res?.exitCode ?? null, durationMs: res?.durationMs ?? null, agentMeta: res === undefined ? null : parseAgentMeta(res.stdout), harnessPathSeen: res?.stdout.includes(harnessDir) ?? false };
        if (record !== null) await writeOutputs(record, condition, prompt.id, rep, [], failed).catch(() => undefined);
        rec = { prompt: prompt.id, condition, rep, ...failed, score: scoreOf([]), error: message };
        log(`${label}: harness-error — ${message.split("\n")[0] ?? message}`);
      } finally {
        if (copy !== undefined) {
          if (args.keep) log(`  복사본 유지: ${copy}`);
          else await fs.rm(copy, { recursive: true, force: true });
        }
      }
      runs.push(rec);

      spent += rec.agentMeta?.costUsd ?? 0;
      if (rec.status !== "ok") failures += 1;
      if (spent > limits.maxTotalUsd) abortReason = `누적 비용 ${usd(spent)} > 한도 ${usd(limits.maxTotalUsd)}`;
      else if (failures >= limits.maxFailures) abortReason = `실패 실행 ${failures}개 ≥ 한도 ${limits.maxFailures}개`;
      if (abortReason !== null) {
        log(`중단: ${abortReason} — 남은 실행 ${jobs.length - runs.length}개는 시작하지 않음`);
        break;
      }
      // 컨트롤러가 중간에 멈춰도 여기까지의 결과가 남도록 실행마다 갱신한다(끝나면 complete로 덮어씀)
      if (out !== null) {
        await writeFileAtomic(out, `${JSON.stringify(buildResult("aborted", INTERIM_REASON), null, 2)}\n`);
        log(`중간 저장 ${runs.length}/${jobs.length}: ${out}`);
      }
    }

    const result = buildResult(abortReason === null ? "complete" : "aborted", abortReason);
    if (out !== null) {
      await writeFileAtomic(out, `${JSON.stringify(result, null, 2)}\n`);
      log(`결과 JSON: ${out}`);
      const md = mdPathOf(out);
      await writeFileAtomic(md, renderReport(result));
      log(`결과 보고서: ${md}`);
    }
    return result;
  } finally {
    await fs.rm(base.dir, { recursive: true, force: true });
    for (const t of templates.values()) await fs.rm(t, { recursive: true, force: true });
  }
}

const pct = (v: number | null): string => (v === null ? "-" : `${(v * 100).toFixed(1)}%`);

/** 사람이 읽는 짧은 요약(표준 출력용). 보고서(md)는 report.ts 몫. */
export function summaryLines(result: BenchResult): string[] {
  const lines = [`${result.repo} · ${result.mode} · ${result.date} · 프롬프트 ${result.prompts.length}개 × 반복 ${result.repeat}${result.status === "aborted" ? ` · 중단됨: ${result.abortReason ?? ""}` : ""}`];
  for (const c of result.conditions) {
    const a = result.aggregate[c];
    if (a === undefined) continue;
    const sums = result.runs.filter((r) => r.condition === c).map(sumsOf);
    const indepUsage = metricOfSums(sums, "indepUsage");
    const typeErrors = metricOfSums(sums, "typeErrors");
    const extra = `${indepUsage !== null ? ` · 독립 사용률 ${pct(indepUsage)}` : ""}${typeErrors !== null ? ` · 타입 오류 ${typeErrors}` : ""}`;
    lines.push(
      `${c.padEnd(8)} 준수율 ${pct(a.compliance)} (token ${a.token} / hardcoded ${a.hardcoded}) · tailwind-default ${a.tailwindDefault} · knownToken ${a.knownToken} · nonDs ${a.nonDs} · dynamic ${a.dynamic} · DS 사용 ${a.dsComponentUses}${extra}${a.mcpToolCalls !== null ? ` · MCP 호출 ${a.mcpToolCalls}` : ""}${a.permissionDenials !== null ? ` · denial ${a.permissionDenials}` : ""} · 실행 ${a.runs} (실패 ${a.failedRuns}, 기대 파일 없음 ${a.missingExpected})${a.costUsd !== null ? ` · $${a.costUsd}` : ""}`,
    );
  }
  return lines;
}

async function main(): Promise<void> {
  const args = parseBenchArgs(process.argv.slice(2));
  if (args.dryRun) {
    process.stdout.write(`${(await planBench(args)).join("\n")}\n`);
    return;
  }
  if (!(await fs.stat(CLI_BIN).then(() => true, () => false))) throw new Error(`${CLI_BIN} 이 없습니다 — 먼저 pnpm -r build 를 실행하세요`);
  const result = await runBench(args, (line) => process.stderr.write(`${line}\n`));
  // replay에 --out이 없으면 파일을 쓰지 않으므로 보고서(md)를 표준 출력으로 낸다
  if (args.agent === null && args.out === null) process.stdout.write(renderReport(result));
  else process.stdout.write(`${summaryLines(result).join("\n")}\n`);
  if (result.status === "aborted") {
    process.stderr.write(`중단됨: ${result.abortReason ?? ""} — 부분 결과는 저장했다. 이 결과로 README 줄을 만들지 않는다.\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e: unknown) => {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(2);
  });
}

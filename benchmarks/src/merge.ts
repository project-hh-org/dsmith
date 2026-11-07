import { CONDITIONS, type BenchResult, type Condition, type MergedSource } from "./model.js";

/** 서로 다른 invocation의 결과(예: 07일 baseline·dsmith + 08일 agents-only·mcp-only)를 하나로 합친다. */

export interface MergeInput {
  /** 보고서에 적는 출처 이름(모노레포 기준 상대 경로) */
  file: string;
  result: BenchResult;
}

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * 같은 레포·베이스 스냅샷 해시·프롬프트 집합(id·파일·sha256)·에이전트 명령·install 도구·반복 수인 agent 결과만 합친다.
 * 날짜·에이전트 버전·dsmith 커밋·관측 모델은 달라도 되고, 입력별로 `merged`에 남겨 보고서의 해석 한계에 적는다.
 * 같은 조건이 두 입력에 있거나, replay·중단된 입력이 있으면 거부한다.
 */
export function mergeResults(inputs: MergeInput[]): BenchResult {
  const first = inputs[0];
  if (first === undefined) throw new Error("병합할 결과가 없습니다");
  const ref = first.result;
  const refPrompts = ref.prompts.map((p) => ({ id: p.id, file: p.file, sha256: p.sha256 })).sort((a, b) => (a.id < b.id ? -1 : 1));
  const seen = new Map<Condition, string>();

  for (const { file, result: r } of inputs) {
    const refuse = (what: string, a: unknown, b: unknown): never => {
      throw new Error(`병합 거부: ${file}의 ${what}가 ${first.file}와 다릅니다 (${String(b)} ≠ ${String(a)})`);
    };
    if (r.mode !== "agent") throw new Error(`병합 거부: ${file}은 ${r.mode} 결과입니다 — 실측(agent) 결과만 병합합니다`);
    if (r.status !== "complete") throw new Error(`병합 거부: ${file}은 중단된 결과입니다(${r.abortReason ?? "이유 기록 없음"})`);
    if (r.repo !== ref.repo) refuse("레포", ref.repo, r.repo);
    if (r.base.snapshotSha256 !== ref.base.snapshotSha256) {
      refuse("베이스 스냅샷 sha256", ref.base.snapshotSha256.slice(0, 12), r.base.snapshotSha256.slice(0, 12));
    }
    if (r.base.tokens !== ref.base.tokens || r.base.dsComponents !== ref.base.dsComponents) {
      refuse("베이스 토큰·DS 컴포넌트 수", `${ref.base.tokens}/${ref.base.dsComponents}`, `${r.base.tokens}/${r.base.dsComponents}`);
    }
    const prompts = r.prompts.map((p) => ({ id: p.id, file: p.file, sha256: p.sha256 })).sort((a, b) => (a.id < b.id ? -1 : 1));
    if (!sameJson(prompts, refPrompts)) {
      refuse("프롬프트 집합(id·파일·sha256)", refPrompts.map((p) => p.id).join(","), prompts.map((p) => p.id).join(","));
    }
    if (r.agent.command !== ref.agent.command) refuse("에이전트 명령(플래그)", ref.agent.command ?? "null", r.agent.command ?? "null");
    if (r.agent.installTool !== ref.agent.installTool) refuse("install 도구", ref.agent.installTool ?? "null", r.agent.installTool ?? "null");
    if (r.repeat !== ref.repeat) refuse("반복 수", ref.repeat, r.repeat);
    for (const c of r.conditions) {
      const other = seen.get(c);
      if (other !== undefined) throw new Error(`병합 거부: 조건 ${c}가 ${other}와 ${file}에 모두 있습니다 — 조건마다 한 입력에서만 가져오세요`);
      seen.set(c, file);
    }
  }

  const results = inputs.map((i) => i.result);
  const conditions: Condition[] = CONDITIONS.filter((c) => seen.has(c));
  const sources: MergedSource[] = inputs.flatMap(
    ({ file, result: r }) =>
      r.merged ?? [{ file, conditions: [...r.conditions], date: r.date, startedAt: r.startedAt, agentVersion: r.agent.version, models: [...r.agent.models], dsmith: { ...r.dsmith } }],
  );
  const versions = [...new Set(results.map((r) => r.agent.version).filter((v): v is string => v !== null))];
  const latest = results.reduce((a, b) => (b.date >= a.date ? b : a));
  const started = results.map((r) => r.startedAt).filter((s): s is string => s !== null).sort();
  const runs = results
    .flatMap((r) => r.runs)
    .sort((a, b) => (a.prompt < b.prompt ? -1 : a.prompt > b.prompt ? 1 : CONDITIONS.indexOf(a.condition) - CONDITIONS.indexOf(b.condition) || a.rep - b.rep));
  const aggregate: BenchResult["aggregate"] = {};
  for (const r of results) Object.assign(aggregate, r.aggregate);

  return {
    version: 1,
    date: latest.date,
    startedAt: started[0] ?? null,
    repo: ref.repo,
    mode: "agent",
    agent: {
      command: ref.agent.command,
      version: versions.length === 0 ? null : versions.join(", "),
      installTool: ref.agent.installTool,
      models: [...new Set(results.flatMap((r) => r.agent.models))].sort(),
    },
    dsmith: { ...latest.dsmith },
    base: { ...ref.base },
    prompts: ref.prompts.map((p) => ({ ...p })),
    conditions,
    repeat: ref.repeat,
    timeoutSec: ref.timeoutSec,
    status: "complete",
    abortReason: null,
    merged: sources,
    runs,
    aggregate,
  };
}

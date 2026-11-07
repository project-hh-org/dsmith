import { CONDITIONS, FINGERPRINT_PARTS, type BenchResult, type Condition, type FingerprintPart, type MergedSource, type SetupFingerprint } from "./model.js";

/** 서로 다른 invocation의 결과(예: 07일 baseline·dsmith + 08일 agents-only·mcp-only)를 하나로 합친다. */

export interface MergeInput {
  /** 보고서에 적는 출처 이름(모노레포 기준 상대 경로) */
  file: string;
  result: BenchResult;
}

const PART_LABEL: Record<FingerprintPart, string> = {
  agentsSection: "AGENTS.md 섹션",
  mcpConfig: ".mcp.json",
  skills: ".claude/skills",
  mcpTools: "MCP 도구 설명·instructions",
};

/**
 * 입력들의 설정 지문을 비교한다. 지문이 없는 옛(legacy) 결과는 legacy끼리만 병합한다.
 * 지문이 있으면 AGENTS.md 섹션·.mcp.json·skills·MCP 도구 설명처럼 둘 이상의 입력이 가진 부분이 서로 같아야 한다.
 */
function checkFingerprints(inputs: MergeInput[]): void {
  const withFp = inputs.filter((i) => i.result.setupFingerprint !== undefined);
  if (withFp.length === 0) return;
  const legacy = inputs.filter((i) => i.result.setupFingerprint === undefined);
  const [fpIn] = withFp;
  const [legacyIn] = legacy;
  if (fpIn !== undefined && legacyIn !== undefined) {
    throw new Error(
      `병합 거부: 설정 지문이 없는 옛 결과(${legacy.map((i) => i.file).join(", ")})와 지문이 있는 결과(${withFp.map((i) => i.file).join(", ")})는 섞지 않습니다 — 옛 결과는 설정(AGENTS.md 문구·MCP 도구 설명)을 기록하지 않아 같은 텍스트를 측정했는지 확인할 수 없습니다`,
    );
  }
  const diffs: string[] = [];
  // AGENTS.md 섹션은 실제 install처럼 설치된 표면(기본 / --mcp / --mcp --skills)에 맞게 렌더링되므로 같은 표면끼리만 비교한다.
  // 섹션 템플릿이 빌드마다 바뀌는 것은 아래 dsmith 커밋 비교로 잡는다.
  const sectionVariant: Record<Condition, string> = { baseline: "none", "agents-only": "default", "mcp-only": "mcp", "agents-mcp": "mcp", dsmith: "mcp+skills" };
  for (const part of FINGERPRINT_PARTS) {
    const groups = new Map<string, Map<string, string[]>>();
    for (const { file, result: r } of inputs) {
      for (const c of CONDITIONS) {
        const v = r.setupFingerprint?.[c]?.[part];
        if (v === null || v === undefined) continue;
        const key = part === "agentsSection" ? sectionVariant[c] : "all";
        const seenPart = groups.get(key) ?? new Map<string, string[]>();
        const list = seenPart.get(v) ?? [];
        list.push(`${c} (${file})`);
        seenPart.set(v, list);
        groups.set(key, seenPart);
      }
    }
    for (const seenPart of groups.values()) {
      if (seenPart.size > 1) {
        diffs.push(`${PART_LABEL[part]}: ${[...seenPart.entries()].map(([v, who]) => `${who.join("·")} = ${v.slice(0, 12)}`).join(" ≠ ")}`);
      }
    }
  }
  const commits = new Set(withFp.map((i) => i.result.dsmith.commit ?? "unknown"));
  if (commits.size > 1) diffs.push(`dsmith 커밋: ${withFp.map((i) => `${i.file} = ${(i.result.dsmith.commit ?? "unknown").slice(0, 12)}`).join(" ≠ ")}`);
  if (diffs.length > 0) {
    throw new Error(`병합 거부: 설정이 다릅니다 — 같은 파일이 입력마다 다른 텍스트입니다. 한쪽을 같은 빌드로 다시 재거나 따로 보고하세요.\n  ${diffs.join("\n  ")}`);
  }
}

const sameJson =(a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * 같은 레포·베이스 스냅샷 해시·프롬프트 집합(id·파일·sha256)·에이전트 명령·install 도구·반복 수인 agent 결과만 합친다.
 * 날짜·에이전트 버전·dsmith 커밋·관측 모델은 달라도 되고, 입력별로 `merged`에 남겨 보고서의 해석 한계에 적는다.
 * 단 설정 지문(AGENTS.md 섹션·MCP 도구 설명 등)은 겹치는 부분이 같아야 하고, 지문 없는 옛 결과는 옛 결과끼리만 합친다.
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

  checkFingerprints(inputs);

  const results = inputs.map((i) => i.result);
  const fingerprints: Partial<Record<Condition, SetupFingerprint>> = {};
  for (const r of results) Object.assign(fingerprints, r.setupFingerprint);
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
    ...(Object.keys(fingerprints).length === 0 ? {} : { setupFingerprint: fingerprints }),
    merged: sources,
    runs,
    aggregate,
  };
}

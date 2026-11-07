import type { IndependentScore, TypeCheckRecord } from "./independent/types.js";

export type { IndependentScore, TypeCheckRecord };

/**
 * 2×2 설계(AGENTS.md DS 섹션 × MCP 서버):
 *  baseline = 둘 다 없음, agents-only = AGENTS.md만, mcp-only = MCP(.mcp.json)만, dsmith = 둘 다.
 * `.dsmith/`는 agents-only·mcp-only·agents-mcp·dsmith에 있고, `.claude/skills`는 dsmith에만 있다.
 * agents-mcp = AGENTS.md + MCP, 슬래시 명령 없음 (dsmith와 비교해 슬래시 명령의 몫을 가른다).
 */
export type Condition = "baseline" | "agents-only" | "mcp-only" | "agents-mcp" | "dsmith";
/** 표시·정렬 순서 */
export const CONDITIONS: readonly Condition[] = ["baseline", "agents-only", "mcp-only", "agents-mcp", "dsmith"];
/** `--conditions`를 생략했을 때의 조건(기존 2조건 비교) */
export const DEFAULT_CONDITIONS: readonly Condition[] = ["baseline", "dsmith"];

/**
 * 조건 복사본에서 dsmith가 에이전트에 보이는 파일의 sha256. 없는 파일은 null.
 * 병합이 "같은 텍스트를 측정했는가"를 검사하는 근거라 날짜·커밋 같은 메타데이터는 넣지 않는다.
 */
export interface SetupFingerprint {
  /** AGENTS.md의 dsmith 마커 블록 텍스트 */
  agentsSection: string | null;
  /** `.mcp.json` — 절대 경로를 `<abs>/이름`으로 바꾼 정규화본 */
  mcpConfig: string | null;
  /** `.claude/skills/**` 경로와 내용 */
  skills: string | null;
  /** 복사본에서 띄운 MCP 서버의 `instructions`와 `tools/list`(이름·설명) */
  mcpTools: string | null;
  /** 위 넷을 합친 sha256 */
  all: string;
}
export const FINGERPRINT_PARTS = ["agentsSection", "mcpConfig", "skills", "mcpTools"] as const;
export type FingerprintPart = (typeof FINGERPRINT_PARTS)[number];

/** 병합된 결과(`bench:report --in a --in b`)에서 입력 하나의 출처 */
export interface MergedSource {
  /** 입력 결과 JSON의 모노레포 기준 상대 경로(밖이면 파일 이름) */
  file: string;
  conditions: Condition[];
  date: string;
  startedAt: string | null;
  agentVersion: string | null;
  models: string[];
  dsmith: { version: string; commit: string | null };
}

/** 한 파일(또는 합계)에서 에이전트가 새로 만든 스타일 사용 수 */
export interface UsageCounts {
  /** rated && source "token" (새로 생긴 것) */
  token: number;
  /** token 중 isKnownTokenRef 참 */
  knownToken: number;
  /** no-hardcoded-style finding(eligible) 수 — evaluateFile 기준 */
  hardcoded: number;
  /** 그중 replacement !== null */
  replaceable: number;
  /** rated && source "tailwind-default" */
  tailwindDefault: number;
  /** source "dynamic" */
  dynamic: number;
}

export interface FileScore {
  /** 복사본 root 상대 POSIX */
  file: string;
  status: "added" | "modified";
  /** 추출·파싱이 던짐 → 집계에서 뺀다(파일 수에는 셈) */
  parseFailed: boolean;
  introduced: UsageCounts;
  /** prefer-ds-component finding(새로 생긴 것) */
  nonDs: number;
  /** no-deprecated-component finding(새로 생긴 것) */
  deprecated: number;
  /** 새로 생긴 컴포넌트 사용 중 module이 DS module인 것 */
  dsComponentUses: number;
  nonDsDetails: { name: string; module: string; preferModule: string }[];
}

export interface RunScore {
  /** file 순 */
  files: FileScore[];
  /** snapshot.exclude 매칭(예: design-system/**) — 채점 안 함 */
  excluded: string[];
  /** 스크립트·Extractor 대상 아님, 또는 하네스 관리 파일(IGNORED) */
  ignored: string[];
  deleted: string[];
  /** 프롬프트의 file이 added|modified에 있는가 */
  expectedFile: boolean;
  totals: UsageCounts & { nonDs: number; deprecated: number; dsComponentUses: number; parseFailed: number; files: number };
  /** token / (token + hardcoded), 분모 0이면 null, 소수 4자리 */
  compliance: number | null;
  /** token / (token + hardcoded + tailwindDefault) */
  tokenShareAll: number | null;
}

export interface AgentMeta {
  costUsd?: number;
  turns?: number;
  subtype?: string;
  models?: string[];
  permissionDenials?: number;
  isError?: boolean;
  /** stream-json의 assistant `mcp__*` tool_use 수(스트림이 아니면 없음) */
  mcpToolCalls?: number;
}

export interface RunRecord {
  prompt: string;
  condition: Condition;
  rep: number;
  /** harness-error: 하네스가 이 실행을 처리하다 던진 예외(error에 메시지) — 던지지 않고 기록한다 */
  status: "ok" | "agent-error" | "timeout" | "replay" | "missing" | "harness-error";
  exitCode: number | null;
  durationMs: number | null;
  agentMeta: AgentMeta | null;
  harnessPathSeen: boolean;
  score: RunScore;
  /** dsmith와 독립인 채점(옛 결과 JSON에는 없다) */
  independent?: IndependentScore;
  /** 바뀐 파일의 타입 검사(옛 결과 JSON에는 없다) */
  typeCheck?: TypeCheckRecord;
  error?: string;
}

export interface Aggregate extends UsageCounts {
  runs: number;
  okRuns: number;
  failedRuns: number;
  missingExpected: number;
  harnessPathSeen: number;
  nonDs: number;
  deprecated: number;
  dsComponentUses: number;
  parseFailed: number;
  files: number;
  compliance: number | null;
  tokenShareAll: number | null;
  /** agentMeta.costUsd 합(하나도 없으면 null) */
  costUsd: number | null;
  turns: number | null;
  /** agentMeta.mcpToolCalls 합(하나도 없으면 null) */
  mcpToolCalls: number | null;
  /** agentMeta.permissionDenials 합(하나도 없으면 null) */
  permissionDenials: number | null;
}

/** replay 디렉터리의 meta.json이 기록한 산출물 출처. 없으면 unknown */
export type ReplaySource = "synthetic" | "agent" | "unknown";

export interface BenchResult {
  version: 1;
  /** YYYY-MM-DD */
  date: string;
  /** ISO, replay면 null */
  startedAt: string | null;
  repo: "legacy-demo" | "with-ds-app";
  mode: "agent" | "replay";
  agent: { command: string | null; version: string | null; installTool: string | null; models: string[] };
  dsmith: { version: string; commit: string | null };
  base: { tokens: number; dsComponents: number; snapshotSha256: string };
  prompts: { id: string; file: string; sha256: string }[];
  conditions: Condition[];
  repeat: number;
  timeoutSec: number | null;
  /** complete: 계획한 실행을 모두 마침. aborted: 중단 기준을 넘었거나, 아직 끝나지 않은 중간 저장본 */
  status: "complete" | "aborted";
  abortReason: string | null;
  /** replay 모드에서만: 산출물의 출처(replay 디렉터리 meta.json) */
  replaySource?: ReplaySource;
  /** 조건별 설정 지문. 없으면 지문을 기록하기 전의 결과(legacy) — 병합은 legacy끼리만 허용한다 */
  setupFingerprint?: Partial<Record<Condition, SetupFingerprint>>;
  /** 여러 실행을 병합한 결과에서만: 입력별 출처(없으면 단일 실행) */
  merged?: MergedSource[];
  runs: RunRecord[];
  aggregate: Partial<Record<Condition, Aggregate>>;
}

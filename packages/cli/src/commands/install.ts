import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AI_TOOLS,
  DEFAULT_CLI,
  TOML_MARKERS,
  defaultMcpLaunch,
  detectTools,
  loadCommands,
  normalizeTools,
  parseMcpCommand,
  renderers,
  type AiTool,
  type McpLaunch,
  type RenderContext,
  type ToolDetection,
} from "@dsmith-dev/agent-skill";
import { runAi } from "@dsmith-dev/catalog";
import { regionKey, safeWrite, type PlannedWrite, type WriteOutcome } from "@dsmith-dev/core";
import { cliVersion } from "../version.js";

export interface InstallOptions {
  root: string;
  /** 기본 os.homedir() — 테스트가 주입 */
  home?: string;
  /** --tool (반복 가능). 주면 감지를 건너뛴다 */
  tools?: AiTool[];
  /** --all = AI_TOOLS 전부. --tool보다 우선 */
  all?: boolean;
  global?: boolean;
  dryRun?: boolean;
  force?: boolean;
  /** --mcp-command "<cmd> [args…]" (배포 전 로컬 개발용). 주면 mcp도 켠다 */
  mcpCommand?: string;
  /** --mcp: MCP 서버 등록(.mcp.json 등)을 쓴다. 기본은 쓰지 않는다 */
  mcp?: boolean;
  /** --skills: 슬래시 명령·스킬 파일(.claude/skills 등)을 쓴다. 기본은 쓰지 않는다 */
  skills?: boolean;
  /**
   * 기본 true: AGENTS.md의 DS 섹션(`dsmith ai`가 만드는 `dsmith:ds` 블록)을 보장한다.
   * 분석 결과가 없으면 쓰지 못하고 note를 남긴다. `--global`에서는 건너뛴다. 테스트가 끌 수 있다.
   */
  ds?: boolean;
  /** dsmith 버전. 기본은 cli package.json. 테스트가 주입한다 */
  version?: string;
}

export interface InstallResult {
  scope: "repo" | "global";
  /** 선택된 도구(글로벌 미지원 도구도 포함) */
  tools: AiTool[];
  /** 선택됐지만 이 스코프에서 쓸 파일이 없는 도구(예: --global의 cursor) */
  unsupported: AiTool[];
  /** 도구를 어떻게 골랐는지: 감지 / --tool / --all */
  selection: "detected" | "tool" | "all";
  /** --tool/--all이면 null. --global이면 홈 흔적만 담는다 */
  detection: ToolDetection | null;
  mcp: McpLaunch;
  /** 이번 실행이 설치한 표면. false인 것은 쓰지 않았고, 이미 있는 파일도 지우지 않았다 */
  surfaces: { mcp: boolean; skills: boolean };
  /** AGENTS.md DS 섹션(`dsmith ai`) 결과 */
  ds: DsOutcome;
  /**
   * 이전 설치가 쓴 MCP·스킬 파일 중 이번 실행이 그 표면을 켜지 않아 손대지 않은 것(표시용 경로).
   * 새 문구로 갱신하려면 `--mcp`·`--skills`로 다시 실행해야 한다.
   */
  kept: string[];
  /** 명령 본문과 AGENTS.md 블록이 부르는 CLI 실행 명령(기본 `npx dsmith`) */
  cli: string;
  outcomes: WriteOutcome[];
  /** 스킬·명령(MCP 설정이 아닌) 쓰기가 하나 이상 있었고 전부 건너뛰어졌다. 실제로 쓴 실행(dry-run 아님)에만 true로 둔다 */
  allSkillsSkipped?: true;
  notes: string[];
  /** 표시용 매니페스트 경로 */
  manifest: string;
  dryRun: boolean;
}

export type DsOutcome =
  | { status: "ok"; file: string; outcome: WriteOutcome["status"]; components: number; catalogFile: string | null }
  | { status: "skipped"; reason: string };

/** 스킵된 표면 안내(기본 설치). 근거는 README `## 벤치마크`와 benchmarks/results/2026-11-08-legacy-demo-sameday.md */
export const SURFACES_SKIPPED_REASON = "벤치마크: AGENTS.md만 있을 때 토큰 사용률이 가장 높았음";

const CODEX_DUPLICATE_REASON = "config.toml에 dsmith가 관리하지 않는 [mcp_servers.dsmith]가 있음";
const CODEX_INLINE_REASON = "config.toml이 mcp_servers를 인라인 테이블로 정의해 [mcp_servers.dsmith]를 추가할 수 없음";

// --- Codex config.toml: dsmith 마커 블록 밖의 [mcp_servers.dsmith] 점검 -------------------------------------------

const KEY_PART = String.raw`(?:[A-Za-z0-9_-]+|"[^"]*"|'[^']*')`;
const DOTTED_KEY = String.raw`${KEY_PART}(?:\s*\.\s*${KEY_PART})*`;
const HEADER_RE = new RegExp(String.raw`^\[\[?\s*(${DOTTED_KEY})\s*\]\]?\s*(?:#.*)?$`);
const KEY_RE = new RegExp(String.raw`^(${DOTTED_KEY})\s*=`);

function splitKey(key: string): string[] {
  return [...key.matchAll(new RegExp(KEY_PART, "g"))].map((m) => m[0].replace(/^["']|["']$/g, ""));
}

/** dsmith 마커 블록(시작·끝이 한 쌍일 때)을 지운 줄 목록. 마커가 어긋나면 null — 그때는 safeWrite가 사유를 낸다. */
function withoutManagedBlock(text: string): string[] | null {
  const lines = text.replace(/^﻿/, "").split("\n");
  const is = (line: string, marker: string): boolean => line.replace(/\r$/, "").trim() === marker;
  const starts = lines.flatMap((l, i) => (is(l, TOML_MARKERS.start) ? [i] : []));
  const ends = lines.flatMap((l, i) => (is(l, TOML_MARKERS.end) ? [i] : []));
  if (starts.length === 0 && ends.length === 0) return lines;
  const [s] = starts;
  const [e] = ends;
  if (starts.length !== 1 || ends.length !== 1 || s === undefined || e === undefined || e < s) return null;
  return [...lines.slice(0, s), ...lines.slice(e + 1)];
}

/**
 * 마커 블록 밖에 사용자가 직접 둔 dsmith MCP 설정이 있는가. 있으면 같은 이름의 테이블이 둘이 되어 TOML이 깨진다.
 * 잡는 모양: `[mcp_servers.dsmith]`(따옴표·공백·`[[…]]` 포함), 최상위 `mcp_servers.dsmith.… =`,
 * `[mcp_servers]` 안의 `dsmith… =`, 최상위 인라인 `mcp_servers = {…}`. `[mcp_servers.dsmith.env]` 같은 하위 테이블은 제외.
 * 여러 줄 문자열 안의 줄까지는 구분하지 않는다 — 오탐은 쓰기를 건너뛸 뿐이다.
 */
export function foreignDsmithMcpTable(text: string): "table" | "inline" | null {
  const lines = withoutManagedBlock(text);
  if (lines === null) return null;
  let section: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const header = HEADER_RE.exec(line);
    if (header !== null) {
      section = splitKey(header[1] as string);
      if (section.length === 2 && section[0] === "mcp_servers" && section[1] === "dsmith") return "table";
      continue;
    }
    if (line.startsWith("[")) {
      section = ["?"]; // 해석할 수 없는 헤더 — 이어지는 키는 남의 테이블로 본다
      continue;
    }
    const key = KEY_RE.exec(line);
    if (key === null) continue;
    if (section.length > 1 || (section.length === 1 && section[0] !== "mcp_servers")) continue;
    const full = [...section, ...splitKey(key[1] as string)];
    if (full[0] === "mcp_servers" && full[1] === "dsmith") return "table";
    if (section.length === 0 && full.length === 1 && full[0] === "mcp_servers") {
      return /(^|[{,\s])(["']?)dsmith\2\s*[=.]/.test(line.slice(key[0].length)) ? "table" : "inline";
    }
  }
  return null;
}

// --- 도구 결정 ------------------------------------------------------------------------------------------

function validateTools(tools: readonly string[]): AiTool[] {
  for (const t of tools) {
    if (!(AI_TOOLS as readonly string[]).includes(t)) {
      throw new Error(`알 수 없는 AI 도구: ${JSON.stringify(t)} (허용: ${AI_TOOLS.join(", ")})`);
    }
  }
  return tools as AiTool[];
}


/** codex는 agents-md를 함께 설치한다. 단 `--global`에서는 agents-md가 미지원이라, 직접 요청하지 않았으면 붙이지 않는다. */
function normalizeFor(scope: "repo" | "global", requested: AiTool[]): AiTool[] {
  const normalized = normalizeTools(requested);
  return scope === "global" && !requested.includes("agents-md") ? normalized.filter((t) => t !== "agents-md") : normalized;
}

/** --global은 홈의 흔적(`~/`로 시작하는 근거)만 센다. 홈에 흔적이 없으면 기본값 claude-code 하나. */
async function detectFor(scope: "repo" | "global", root: string, home: string): Promise<ToolDetection> {
  const full = await detectTools(root, home);
  if (scope === "repo") return full;
  const evidence: ToolDetection["evidence"] = {};
  for (const tool of AI_TOOLS) {
    const homeOnly = (full.evidence[tool] ?? []).filter((label) => label.startsWith("~/"));
    if (homeOnly.length > 0) evidence[tool] = homeOnly;
  }
  const found = Object.keys(evidence) as AiTool[];
  if (found.length === 0) return { tools: ["claude-code"], evidence, defaulted: true };
  return { tools: normalizeFor("global", found), evidence, defaulted: false };
}

// --- 실행 -----------------------------------------------------------------------------------------------

const launchText = (m: McpLaunch): string => [m.command, ...m.args].join(" ");

async function readText(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return null; // 없거나 못 읽는 파일은 safeWrite가 사유를 낸다
  }
}

async function manifestIsReadable(file: string): Promise<boolean> {
  const text = await readText(file);
  if (text === null) return true; // 아직 없음 — 정상
  try {
    const parsed: unknown = JSON.parse(text);
    const entries = (parsed as { entries?: unknown } | null)?.entries;
    return typeof entries === "object" && entries !== null && !Array.isArray(entries);
  } catch {
    return false;
  }
}

function displayPath(file: string, root: string, home: string): string {
  const posix = (p: string): string => p.split(path.sep).join("/");
  for (const [base, prefix] of [[root, ""], [home, "~/"]] as const) {
    const rel = path.relative(base, file);
    if (rel !== "" && rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel)) return `${prefix}${posix(rel)}`;
  }
  return posix(file);
}

/** 건너뛴 설정 파일에 사용자가 직접 넣을 내용(JSON 키 또는 TOML 항목). 설정 파일이 아니면 null. */
function manualSnippet(w: PlannedWrite, mcp: McpLaunch, inlineToml: boolean): string | null {
  if (w.region.kind === "json-key") {
    let value: unknown = JSON.parse(w.content);
    for (const key of [...w.region.keyPath].reverse()) value = { [key]: value };
    return JSON.stringify(value, null, 2);
  }
  if (w.region.kind === "block" && w.region.start === TOML_MARKERS.start) {
    if (!inlineToml) return w.content.trimEnd();
    const args = mcp.args.map((a) => JSON.stringify(a)).join(", ");
    return `dsmith = { command = ${JSON.stringify(mcp.command)}, args = [${args}] }`;
  }
  return null;
}

/** 설치 매니페스트 항목 키(`파일#region`)가 MCP 설정 항목인가 */
const isMcpKey = (key: string): boolean => /#json:\["mcpServers"|config\.toml#/.test(key);
// 슬래시 명령·스킬 파일(`.claude/skills/<ds 명령>/SKILL.md`, `.cursor/commands/<ds 명령>.md` 등)인가
const isSkillKey = (key: string): boolean =>
  /(?:^|\/)(?:skills\/ds(?:-[a-z]+)?\/SKILL\.md|commands\/ds(?:-[a-z]+)?\.(?:md|toml))$/.test(key.split("#")[0] ?? "");

/**
 * 이전 `install`이 매니페스트에 남긴 MCP·스킬 파일 중, 이번 실행이 켜지 않은 표면의 것(디스크에 있는 것만).
 * 이 파일들은 지우지도 갱신하지도 않는다.
 */
async function keptFromEarlierInstall(a: {
  manifestFile: string;
  root: string;
  home: string;
  base: string;
  surfaces: { mcp: boolean; skills: boolean };
}): Promise<{ mcp: string[]; skills: string[] }> {
  const out = { mcp: [] as string[], skills: [] as string[] };
  const text = await readText(a.manifestFile);
  if (text === null) return out;
  let entries: Record<string, unknown>;
  try {
    const parsed = (JSON.parse(text) as { entries?: unknown } | null)?.entries;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return out;
    entries = parsed as Record<string, unknown>;
  } catch {
    return out;
  }
  for (const key of Object.keys(entries).sort()) {
    const kind = isMcpKey(key) ? "mcp" : isSkillKey(key) ? "skills" : null;
    if (kind === null || a.surfaces[kind]) continue;
    const file = key.split("#")[0] ?? "";
    const abs = path.isAbsolute(file) ? file : path.join(a.base, file);
    try {
      await fs.access(abs);
    } catch {
      continue;
    }
    const shown = displayPath(abs, a.root, a.home);
    if (!out[kind].includes(shown)) out[kind].push(shown);
  }
  return out;
}

/** `dsmith ai`와 같은 경로로 AGENTS.md DS 섹션을 만든다. 못 만들면 사유를 note로 남기고 설치는 계속한다. */
async function ensureDsSection(a: {
  root: string;
  version: string;
  surfaces: { mcp: boolean; skills: boolean };
  scope: "repo" | "global";
  dryRun: boolean;
  force: boolean;
  enabled: boolean;
  notes: string[];
}): Promise<DsOutcome> {
  if (!a.enabled) return { status: "skipped", reason: "건너뜀 요청" };
  if (a.scope === "global") return { status: "skipped", reason: "--global은 레포의 AGENTS.md를 쓰지 않음" };
  try {
    const r = await runAi({
      root: a.root,
      version: a.version,
      // 이번에 켠 표면은 파일이 아직 없을 수 있다(dry-run) — 디스크에서 읽은 설치 상태에 더해 규칙에 반영한다
      surfaces: a.surfaces,
      ...(a.dryRun ? { dryRun: true } : {}),
      ...(a.force ? { force: true } : {}),
    });
    a.notes.push(...r.notes, ...r.warnings.map((w) => `경고: ${w}`));
    const outcome = r.outcomes[0];
    if (outcome === undefined) return { status: "skipped", reason: r.warnings[0] ?? "AGENTS.md DS 섹션을 만들 컴포넌트가 없음" };
    if (outcome.status.startsWith("skipped")) {
      a.notes.push(`${outcome.file}의 DS 섹션을 건너뜀: ${outcome.reason ?? outcome.status} (--force로 덮어쓰기)`);
    }
    return { status: "ok", file: outcome.file, outcome: outcome.status, components: r.components, catalogFile: r.catalogFile };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    a.notes.push(`AGENTS.md DS 섹션을 만들지 못함: ${reason}. \`${DEFAULT_CLI} audit\` → \`init\` → \`ai\` 뒤 다시 실행하세요.`);
    return { status: "skipped", reason };
  }
}

export async function runInstall(opts: InstallOptions): Promise<InstallResult> {
  const scope = opts.global === true ? "global" : "repo";
  const root = path.resolve(opts.root);
  const home = path.resolve(opts.home ?? os.homedir());
  const version = opts.version ?? cliVersion();
  const dryRun = opts.dryRun === true;
  const force = opts.force === true;
  // MCP·스킬은 선택이다. --mcp-command는 MCP를 쓰겠다는 뜻이라 mcp를 함께 켠다.
  const surfaces = { mcp: opts.mcp === true || opts.mcpCommand !== undefined, skills: opts.skills === true };

  // 1. MCP·CLI 실행 명령 — 0.0.0(로컬 개발 빌드)이면 npx로 받을 배포판이 없으므로 --mcp-command가 필수(MCP·스킬을 쓸 때만)
  if (opts.mcpCommand === undefined && version === "0.0.0" && (surfaces.mcp || surfaces.skills)) {
    const bin = fileURLToPath(new URL("../bin.js", import.meta.url));
    throw new Error(
      `로컬 개발 빌드(0.0.0)에는 npx로 받을 배포판이 없습니다. 이 빌드를 쓰려면 --mcp-command 를 주세요: --mcp-command "node ${bin}"`,
    );
  }
  const mcp = opts.mcpCommand !== undefined ? parseMcpCommand(opts.mcpCommand) : defaultMcpLaunch(version);
  // 슬래시 명령 본문의 CLI 호출도 같은 빌드를 쓴다: `node /abs/dist/bin.js mcp` → `node /abs/dist/bin.js`
  const cli = opts.mcpCommand !== undefined ? [mcp.command, ...mcp.args.slice(0, -1)].join(" ") : DEFAULT_CLI;
  const notes: string[] = [];
  if (opts.mcpCommand !== undefined && scope === "repo" && (surfaces.mcp || surfaces.skills)) {
    notes.push(
      `경고: --mcp-command(${cli})의 경로는 이 컴퓨터에만 있습니다. 슬래시 명령·AGENTS.md·MCP 설정 등 레포에 쓰는 파일에 이 경로가 들어가므로 커밋하면 다른 사람 환경에서 동작하지 않습니다. 커밋하지 마세요.`,
    );
  }

  // 2. 도구 결정: --all > --tool > 감지. codex는 agents-md를 함께 설치한다.
  let selection: InstallResult["selection"];
  let detection: ToolDetection | null = null;
  let tools: AiTool[];
  if (opts.all === true) {
    selection = "all";
    tools = normalizeFor(scope, [...AI_TOOLS]);
  } else if (opts.tools !== undefined && opts.tools.length > 0) {
    selection = "tool";
    tools = normalizeFor(scope, validateTools(opts.tools));
  } else {
    selection = "detected";
    detection = await detectFor(scope, root, home);
    tools = detection.tools;
  }

  // 3. 전부 렌더한다 — 렌더러 하나라도 실패하면 아무것도 쓰기 전에 중단된다.
  const commands = await loadCommands();
  const planned: PlannedWrite[] = [];
  const unsupported: AiTool[] = [];
  for (const tool of tools) {
    const ctx: RenderContext = {
      root,
      home,
      scope,
      mcp,
      cli,
      ...(version === "0.0.0" && opts.mcpCommand !== undefined ? { devMcpCommand: opts.mcpCommand } : {}),
    };
    const out = renderers[tool].render(commands, { ...ctx, include: surfaces });
    if (out.writes.length === 0) {
      // 표면을 안 골라 비었을 수 있다 — 전부 켜도 쓸 파일이 없을 때만(예: --global의 cursor) 미지원이다.
      if (renderers[tool].render(commands, { ...ctx, include: { mcp: true, skills: true } }).writes.length === 0) unsupported.push(tool);
    }
    planned.push(...out.writes);
    notes.push(...out.notes);
  }

  const base = scope === "repo" ? root : home;
  const manifestFile = path.join(base, ".dsmith", "install.json");
  const manifestShown = displayPath(manifestFile, root, home);
  if (!(await manifestIsReadable(manifestFile))) {
    notes.push(
      `경고: ${manifestShown}을 읽을 수 없어 비어 있는 것으로 봅니다. 내용이 같은 기존 파일은 그대로 채택하고, 다른 파일은 건너뜁니다(--force로 덮어쓰기).`,
    );
  }

  // 4. Codex config.toml에 dsmith가 관리하지 않는 [mcp_servers.dsmith]가 있으면 쓰지 않는다 — --force로도 넘지 못한다.
  const preSkipped = new Map<PlannedWrite, { outcome: WriteOutcome; inline: boolean }>();
  for (const w of planned) {
    if (w.region.kind !== "block" || w.region.start !== TOML_MARKERS.start) continue;
    const text = await readText(w.file);
    const found = text === null ? null : foreignDsmithMcpTable(text);
    if (found === null) continue;
    preSkipped.set(w, {
      inline: found === "inline",
      outcome: {
        file: displayPath(w.file, root, home),
        key: regionKey(w, manifestFile),
        region: "block",
        status: "skipped-invalid",
        reason: found === "inline" ? CODEX_INLINE_REASON : CODEX_DUPLICATE_REASON,
      },
    });
  }

  // 5. 한 번의 safeWrite(매니페스트 하나)
  const writes = planned.filter((w) => !preSkipped.has(w));
  const written =
    writes.length === 0
      ? []
      : (
          await safeWrite(writes, {
            manifestFile,
            displayRoot: root,
            confineTo: base,
            home,
            dryRun,
            force,
            tool: "install",
            version,
          })
        ).outcomes;
  const queue = [...written];
  const outcomes = planned.map((w) => preSkipped.get(w)?.outcome ?? (queue.shift() as WriteOutcome));

  // 6. 건너뛴 설정 파일마다 사용자가 직접 넣을 내용을 알려 준다.
  planned.forEach((w, i) => {
    const o = outcomes[i] as WriteOutcome;
    if (!o.status.startsWith("skipped")) return;
    const pre = preSkipped.get(w);
    const snippet = manualSnippet(w, mcp, pre?.inline === true);
    if (snippet === null) return;
    const intro =
      pre === undefined
        ? `${o.file}을 건너뛰어 dsmith MCP 항목이 등록되지 않았습니다. 직접 추가하세요:`
        : pre.inline
          ? `${o.file}의 mcp_servers가 인라인 테이블이라 쓰지 않았습니다. 테이블 안에 직접 추가하세요:`
          : `${o.file}에 dsmith가 관리하지 않는 항목이 있어 쓰지 않았습니다. 아래 내용과 같은지 확인하세요:`;
    notes.push(`${intro}\n${snippet.replace(/^/gm, "  ")}`);
  });

  // 스킬·명령 쓰기(MCP 설정 영역이 아닌 것)가 있었는데 전부 건너뛰어졌으면 `/ds`로 시작할 수 없다.
  const isMcpConfig = (w: PlannedWrite): boolean =>
    w.region.kind === "json-key" || (w.region.kind === "block" && w.region.start === TOML_MARKERS.start);
  const skillOutcomes = outcomes.filter((_, i) => !isMcpConfig(planned[i] as PlannedWrite));
  const allSkillsSkipped = !dryRun && skillOutcomes.length > 0 && skillOutcomes.every((o) => o.status.startsWith("skipped"));

  // 7. AGENTS.md DS 섹션(`dsmith ai`). 기본 설치의 중심이다 — MCP·스킬 없이 이것만 있을 때 벤치마크 점수가 가장 높았다.
  const ds = await ensureDsSection({ root, version, surfaces, scope, dryRun, force, enabled: opts.ds !== false, notes });

  // 8. 이전 설치의 MCP·스킬 파일 중 이번에 켜지 않은 표면의 것은 그대로 둔다 — 갱신되지 않았다고 요약에 밝힌다.
  const earlier = await keptFromEarlierInstall({ manifestFile, root, home, base, surfaces });
  const kept = [...earlier.mcp, ...earlier.skills];

  return {
    scope,
    tools,
    unsupported,
    selection,
    detection,
    mcp,
    surfaces,
    ds,
    kept,
    cli,
    outcomes,
    ...(allSkillsSkipped ? { allSkillsSkipped: true as const } : {}),
    notes: [...new Set(notes)],
    manifest: manifestShown,
    dryRun,
  };
}

// --- 출력 -----------------------------------------------------------------------------------------------

function toolLabel(tool: AiTool, r: InstallResult): string {
  const labels = r.detection?.evidence[tool] ?? [];
  const repo = labels.filter((l) => !l.startsWith("~/"));
  const home = labels.filter((l) => l.startsWith("~/"));
  const parts = [...(repo.length > 0 ? [`레포: ${repo.join(", ")}`] : []), ...(home.length > 0 ? [`홈: ${home.join(", ")}`] : [])];
  if (parts.length === 0 && tool === "agents-md" && r.detection !== null && !r.detection.defaulted && r.tools.includes("codex")) {
    parts.push("codex와 함께");
  }
  return parts.length === 0 ? tool : `${tool} (${parts.join("; ")})`;
}

function registeredLine(r: InstallResult): string {
  const tagged = (t: AiTool, label: string): string => (r.unsupported.includes(t) ? `${label} [미지원]` : label);
  const plain = r.tools.map((t) => tagged(t, t)).join(", ");
  if (r.selection === "all") return `등록: ${plain} (--all)`;
  if (r.selection === "tool") {
    const paired = r.tools.includes("codex") && r.tools.includes("agents-md") ? ", agents-md는 codex와 함께" : "";
    return `등록: ${plain} (--tool 지정${paired})`;
  }
  if (r.detection?.defaulted === true) {
    return `등록: ${plain} (감지: ${r.scope === "global" ? "홈에 " : ""}흔적 없음 → 기본값)`;
  }
  return `등록: ${r.tools.map((t) => tagged(t, toolLabel(t, r))).join(", ")}`;
}

/** 이번 실행이 설치한 것(사람이 읽는 이름). 쓰지 않기로 한 DS 섹션(테스트 전용)은 적지 않는다. */
function installedNames(r: InstallResult): string[] {
  return [...(r.ds.status === "ok" ? ["AGENTS.md DS 섹션"] : []), ...(r.surfaces.mcp ? ["MCP 서버"] : []), ...(r.surfaces.skills ? ["슬래시 명령"] : [])];
}

/** 이전 설치의 파일이 남아 있어 "기본으로 설치하지 않음"이 사실이 아닌 표면 */
function keptKinds(r: InstallResult): { mcp: boolean; skills: boolean } {
  return { mcp: r.kept.some((p) => !isSkillKey(p)), skills: r.kept.some((p) => isSkillKey(p)) };
}

/**
 * 이전 설치의 MCP·스킬 파일을 이번에 켜지 않아 갱신하지 않았다는 한 줄. 새 문구(규칙 줄 등)를 받으려면 플래그를 다시 줘야 한다.
 * 이전 설치가 없으면 null.
 */
export function keptSurfacesLine(r: InstallResult): string | null {
  const k = keptKinds(r);
  const kept = [...(k.mcp ? [["MCP", "--mcp"]] : []), ...(k.skills ? [["슬래시 명령", "--skills"]] : [])] as [string, string][];
  if (kept.length === 0) return null;
  return `기존 ${kept.map(([n]) => n).join("·")} 파일은 그대로 둠(갱신하지 않음) — 새 문구로 갱신하려면 ${kept.map(([, f]) => f).join(" ")}`;
}

/** MCP·슬래시 명령을 기본으로 설치하지 않는다는 한 줄. 둘 다 켰거나 이전 설치의 파일이 있으면(그건 `keptSurfacesLine`) 그 표면은 뺀다. 남은 게 없으면 null. */
export function skippedSurfacesLine(r: InstallResult): string | null {
  const k = keptKinds(r);
  const skipped = [
    ...(r.surfaces.mcp || k.mcp ? [] : [["MCP", "--mcp"]]),
    ...(r.surfaces.skills || k.skills ? [] : [["슬래시 명령", "--skills"]]),
  ] as [string, string][];
  if (skipped.length === 0) return null;
  const names = skipped.map(([n]) => n).join("·");
  const flags = skipped.map(([, f]) => f).join("·");
  const topic = skipped.length === 1 && skipped[0]?.[0] === "MCP" ? "는" : "은"; // 받침: MCP는, 슬래시 명령은
  return `${names}${topic} 기본으로 설치하지 않음(${SURFACES_SKIPPED_REASON}) — 필요하면 ${flags}`;
}

/** 설치한 도구마다 어떻게 시작하는지. 같은 방법끼리 묶는다. */
function nextLines(r: InstallResult): string[] {
  if (r.dryRun) return ["다음: --dry-run 없이 다시 실행하면 위 내용을 씁니다"];
  if (r.allSkillsSkipped === true) return ["다음: 건너뜀 사유를 해결한 뒤 다시 실행"];
  if (!r.surfaces.mcp && !r.surfaces.skills) {
    return r.ds.status === "ok"
      ? ["다음: AI 도구를 다시 열면 AGENTS.md의 DS 규칙을 읽습니다"]
      : ["다음: 위 할 일을 확인하세요"];
  }
  const active = r.tools.filter((t) => !r.unsupported.includes(t));
  if (!r.surfaces.skills) return ["다음: AI 도구를 다시 열고 MCP 서버(dsmith)를 승인하세요"];
  const slash = active.filter((t) => t === "claude-code" || t === "cursor" || t === "gemini");
  const groups: { tools: AiTool[]; text: string }[] = [];
  if (slash.length > 0) groups.push({ tools: slash, text: "/ds 로 시작" });
  if (active.includes("codex")) groups.push({ tools: ["codex"], text: "$ds 로 시작 (또는 /skills 에서 ds 선택)" });
  if (active.includes("agents-md")) {
    groups.push({ tools: ["agents-md"], text: `AGENTS.md 섹션에 적힌 대로 \`${r.cli} …\` 호출` });
  }
  const [only] = groups;
  if (only === undefined) return ["다음: 이 범위에서 쓴 파일이 없습니다 — 위 할 일을 확인하세요"];
  if (groups.length === 1) {
    return [only.tools[0] === "agents-md" ? `다음: ${only.text}` : `다음: AI 도구를 다시 열고 ${only.text}`];
  }
  return ["다음: AI 도구를 다시 열고", ...groups.map((g) => `- ${g.tools.join(", ")}: ${g.text}`)];
}

/** 사람이 읽는 요약. 등록한 도구와 근거, 파일 개수, 건너뜀 사유, 할 일, 다음 단계. */
export function formatInstallSummary(r: InstallResult): string {
  const count = (...statuses: WriteOutcome["status"][]): number => r.outcomes.filter((o) => statuses.includes(o.status)).length;
  const skipped = r.outcomes.filter((o) => o.status.startsWith("skipped"));
  const lines: string[] = [];
  if (r.dryRun) lines.push("(dry-run — 아무것도 쓰지 않음)");
  // DS 섹션도 못 쓰고 표면도 켜지 않았다 — 기본 install이 분석 결과 없는 레포에서 하는 일. 종료 코드는 0이니 첫 줄에서 분명히 말한다.
  else if (r.ds.status === "skipped" && r.outcomes.length === 0) lines.push("아무것도 쓰지 않음 — AGENTS.md DS 섹션을 만들 수 없고 MCP·슬래시 명령도 요청하지 않았음");
  // `등록:`은 이번 실행이 AI 도구에 쓴 표면(MCP·슬래시 명령)이 있을 때만 — AGENTS.md DS 섹션만 쓴 실행은 도구에 등록한 것이 없다.
  lines.push(
    ...(r.surfaces.mcp || r.surfaces.skills ? [registeredLine(r)] : []),
    ...(installedNames(r).length > 0 ? [`설치: ${installedNames(r).join(" · ")}`] : []),
    `파일: 생성 ${count("created")} · 변경 ${count("updated")} · 유지 ${count("unchanged")} · 건너뜀 ${skipped.length}`,
  );
  if (r.ds.status === "ok") {
    const label: Record<WriteOutcome["status"], string> = {
      created: "생성",
      updated: "변경",
      unchanged: "유지",
      "skipped-modified": "건너뜀",
      "skipped-unowned": "건너뜀",
      "skipped-invalid": "건너뜀",
      "skipped-exists": "건너뜀",
    };
    lines.push(`AGENTS.md DS 섹션: ${label[r.ds.outcome]} (${r.ds.file}, 컴포넌트 ${r.ds.components}개)`);
  } else if (r.ds.reason !== "건너뜀 요청") {
    lines.push(`AGENTS.md DS 섹션: 쓰지 않음 — ${r.ds.reason}`);
  }
  const keptLine = keptSurfacesLine(r);
  if (keptLine !== null) lines.push(keptLine);
  const skippedLine = skippedSurfacesLine(r);
  if (skippedLine !== null) lines.push(skippedLine);
  for (const o of skipped) lines.push(`건너뜀: ${o.file} — ${o.reason ?? o.status}`);
  if (skipped.some((o) => o.status === "skipped-modified" || o.status === "skipped-unowned")) {
    lines.push("건너뛴 파일은 --force로 덮어쓰기");
  }
  if (r.dryRun) {
    for (const o of r.outcomes) {
      // 건너뛸 영역은 실제로 쓰이지 않으므로 diff 대신 사유만 보인다.
      if (o.status.startsWith("skipped")) lines.push("", `${o.file} (건너뜀 예정: ${o.reason ?? o.status})`);
      else if (o.diff !== undefined && o.diff !== "") lines.push("", o.diff.trimEnd());
    }
  }
  const notes = [...new Set(r.notes)];
  if (notes.length > 0) lines.push("", "할 일:", ...notes.map((n) => `- ${n.replace(/\n/g, "\n  ")}`), "");
  lines.push(...nextLines(r));
  return lines.join("\n");
}

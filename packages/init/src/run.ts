import fs from "node:fs/promises";
import path from "node:path";
import {
  atomicWrite,
  COVERAGE_PROPERTIES,
  buildTokenDraft,
  decisionCandidates,
  draftCoverage,
  DEFAULT_TOKEN_NAMING,
  detectNamingFromFiles,
  draftToTokens,
  emitTokensCss,
  emitTailwindPreset,
  emitTokensTs,
  emitTokensTsRn,
  explainDecision,
  GENERATED_NOTICE,
  findTailwindConfig,
  findTokensStylesheetImport,
  isPresetLinked,
  listDecisions,
  listMigrations,
  loadReplacementTokens,
  localDate,
  managedFileHash,
  presetFileName,
  presetFormatFor,
  readCatalog,
  readCatalogTokens,
  readComponentProps,
  readDecisions,
  readCssVariableTokens,
  readIndex,
  recordDecision,
  regionKey,
  cssVarName,
  safeWrite,
  seedDecisions,
  semanticNameOf,
  serializeW3c,
  summarizeComponents,
  TOKENS_NOT_LOADED_NOTE,
  withTokenFiles,
  writeCatalog,
  writeDecisions,
  type ComponentProps,
  type Coverage,
  type DecisionKind,
  type PlannedWrite,
  type ScaleMapping,
  type StyleUsage,
  type TokenDraft,
  type TokenNaming,
  type TokensStylesheetLoaded,
  type WriteOutcome,
  type WriteStatus,
} from "@dsmith-dev/core";
import { excludeGlobs, isDsSpecifier, readDetect } from "@dsmith-dev/detect";
import { normalizeOutDir } from "./out-dir.js";
import { renderInitReport, tokenFileNames } from "./report.js";
import { renderScaffold, type ScaffoldProp } from "./scaffold.js";

export interface InitOptions {
  root: string;
  outDir?: string;
  /** 결정 없이 추천안으로 스캐폴드 상위 top개 */
  all?: boolean;
  /** 기본 10 */
  top?: number;
  dryRun?: boolean;
  /** 토큰 파일만 영향(스캐폴드는 create-only) */
  force?: boolean;
  /** 매니페스트 기록 */
  version: string;
  /** 리포트 파일명 날짜(테스트 주입) */
  now?: Date;
  /** 내부용(rename 흐름) — 감지보다 우선. CLI 플래그로 노출하지 않는다 */
  naming?: TokenNaming;
}

export interface InitScaffold {
  item: string;
  name: string;
  file: string;
  from: string;
  basis: "decided" | "recommended";
  status: WriteStatus;
}

export interface AlphaColor {
  raw: string;
  hex: string;
  count: number;
}

export interface InitResult {
  outDir: string;
  /** mergedValues = Σ members.length */
  tokens: { color: number; spacing: number; radius: number; fontSize: number; total: number; mergedValues: number };
  /**
   * 토큰의 출처. js-theme이면(react-native + 쓰이는 JS 테마) 토큰 파일을 쓰지 않았고 `tokens`·`coverage`는 그 테마 기준이다.
   * init-files = init이 쓰는(쓸) 토큰 파일 — 웹은 json·css·ts 세 개, react-native 테마 없음은 tokens.ts 하나.
   */
  tokenSource: { kind: "init-files" | "js-theme"; files: string[] };
  /** react-native 레포로 실행했나 — 토큰 CSS·Tailwind 프리셋·웹 스캐폴드를 만들지 않는다 */
  reactNative: boolean;
  coverage: Coverage;
  mappings: ScaleMapping[];
  scaffolds: InitScaffold[];
  skippedScaffolds: { item: string; reason: string }[];
  decisions: { added: number; refreshed: number; pending: number; decided: number; stale: number };
  /** 분모(커버리지)에서 빠진 하드코딩 값 수 */
  coverageScope: { unknown: number; nonTokenProperties: number };
  /** --all로 실행했나(요약 문구용) */
  all: boolean;
  /** 알파 채널이 있어 토큰 값(6자리 hex)에서 알파가 빠진 하드코딩 색 */
  alphaDropped: AlphaColor[];
  outcomes: WriteOutcome[];
  /** ".dsmith/reports/init-<date>.md", dryRun이면 null */
  report: string | null;
  /** ".dsmith/init.json" */
  manifest: string;
  dryRun: boolean;
  /** 사람이 알아야 할 것(예: 수정된 스캐폴드가 다른 옵션 기준이라 갱신하지 않음) */
  warnings: string[];
  /** 토큰 3파일을 함께 보류한 이유: modified = 사람이 고침(--force로 덮어씀), invalid = 쓸 수 없는 경로(깨진 심볼릭 링크 등 — --force로도 못 씀), 보류 없음 = null */
  tokenHold: "modified" | "invalid" | "renamed" | null;
  /** 토큰 CSS 변수 이름 형식과 그 출처(명시 > 커밋된 토큰 파일 > .dsmith/init.json > 기본 ds) */
  naming: { value: TokenNaming; source: "explicit" | "token-files" | "manifest" | "default" };
  /** renamed 보류(또는 적용 기록 없을 때 경고)의 근거: 의미 이름 기준 바뀐 토큰. name = 이전 cssVar, to null = 사라짐 */
  renamedTokens: { name: string; from: string; to: string | null }[];
  /**
   * Tailwind 프리셋(v3 `tailwind.preset.{ts,cjs}` / v4 `tailwind.theme.css`). tailwind가 아니거나 버전을 몰라 만들지 않으면 null.
   * linked = tailwind.config의 presets / 진입 CSS의 @import에 연결됨(dry-run이면 현재 파일 기준).
   */
  tailwindPreset: { version: 3 | 4; file: string; linked: boolean } | null;
  /**
   * 어딘가에서 `<outDir>/tokens.css`를 import하는가(JS/TS import·CSS @import·HTML link, 연결된 Tailwind v4 테마 CSS) — migrate가 쓰는 `var(--…)`가 값을 가지려면 필요하다.
   * 토큰 파일을 쓰지 않았으면(보류·쓸 수 없음) 확인하지 않아 null. 안내만 하고 아무것도 막지 않는다.
   */
  tokensLoaded: TokensStylesheetLoaded | null;
  /**
   * `.dsmith/catalog.json`과의 관계. refreshed = 카탈로그의 토큰·토큰 파일 해시를 이번 산출로 갱신함, current = 이미 같음,
   * needs-ai = 카탈로그가 없거나 이 산출 디렉터리를 담고 있지 않음(`dsmith ai` 필요), null = dry-run이라 보지 않음
   */
  catalog: "refreshed" | "current" | "needs-ai" | null;
}

const NEED_AUDIT = "먼저 `dsmith audit`을 실행하세요";
const MANIFEST = ".dsmith/init.json";
const DEFAULT_TOP = 10;
const TOP_USES = 3;
const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/;

interface Target {
  item: string;
  kind: "duplicate" | "local-definition";
  basis: "decided" | "recommended";
}

/** 하드코딩 색 중 알파가 1 미만인 것(raw 기준 집계). 토큰은 6자리 hex라 알파가 빠진다. */
function alphaOfValue(value: string): number | null {
  const v = value.trim();
  const hex = /^#(?:[0-9a-f]{3}([0-9a-f])|[0-9a-f]{6}([0-9a-f]{2}))$/i.exec(v);
  if (hex !== null) {
    const digits = hex[1] ?? hex[2] ?? "f";
    return Number.parseInt(digits.length === 1 ? digits + digits : digits, 16) / 255;
  }
  const slash = /^[a-z-]+\(.*\/\s*([\d.]+)(%?)\s*\)$/i.exec(v);
  if (slash !== null) return Number(slash[1]) / (slash[2] === "%" ? 100 : 1);
  const legacy = /^(?:rgba|hsla)\(([^)]*)\)$/i.exec(v);
  if (legacy !== null) {
    const parts = (legacy[1] ?? "").split(",");
    if (parts.length === 4) {
      const last = (parts[3] ?? "").trim();
      return last.endsWith("%") ? Number.parseFloat(last) / 100 : Number(last);
    }
  }
  return null;
}

/**
 * raw의 알파. Tailwind 클래스(`hover:bg-[#11182780]`, `text-[rgba(0,0,0,0.5)]`, `bg-[#111]/50`)는
 * 변형·유틸리티 접두사를 떼고 마지막 `[...]` 안 값과 뒤따르는 `/불투명도`를 읽는다.
 */
function alphaOf(raw: string): number | null {
  const bracket = /\[([^[\]]+)\](?:\/(\d+(?:\.\d+)?|\[[^\]]+\]))?$/.exec(raw.trim());
  if (bracket === null) return alphaOfValue(raw);
  const inner = alphaOfValue((bracket[1] ?? "").replace(/_/g, " "));
  const modifier = bracket[2];
  if (modifier !== undefined) {
    const n = modifier.startsWith("[") ? Number(modifier.slice(1, -1)) : Number(modifier) / 100;
    if (Number.isFinite(n)) return n > 1 ? n / 100 : n;
  }
  return inner;
}

/** 분모에서 빠진 하드코딩 값 수: 정규화하지 못한 값(unknown)과 토큰 대상이 아닌 길이(width·height) */
function coverageScope(styles: StyleUsage[], outDir: string): { unknown: number; nonTokenProperties: number } {
  let unknown = 0;
  let nonTokenProperties = 0;
  for (const u of styles) {
    if (u.source !== "hardcoded" || u.file === outDir || u.file.startsWith(`${outDir}/`)) continue;
    if ((COVERAGE_PROPERTIES as readonly string[]).includes(u.property)) {
      if (u.normalized.kind === "unknown") unknown += 1;
    } else if (u.property === "width" || u.property === "height") {
      nonTokenProperties += 1;
    }
  }
  return { unknown, nonTokenProperties };
}

function alphaDropped(styles: StyleUsage[], outDir: string): AlphaColor[] {
  const found = new Map<string, AlphaColor>();
  for (const u of styles) {
    if (u.source !== "hardcoded" || u.normalized.kind !== "color") continue;
    if (u.file === outDir || u.file.startsWith(`${outDir}/`)) continue;
    const alpha = alphaOf(u.raw);
    if (alpha === null || !(alpha < 1)) continue;
    const entry = found.get(u.raw) ?? { raw: u.raw, hex: u.normalized.hex, count: 0 };
    entry.count += 1;
    found.set(u.raw, entry);
  }
  return [...found.values()].sort((a, b) => b.count - a.count || (a.raw < b.raw ? -1 : a.raw > b.raw ? 1 : 0));
}

/**
 * 매니페스트에 `outDir`·`updatedAt`을 덧붙인다(ai가 가장 최근 init 산출 디렉터리를 찾는 근거).
 * 이번 실행에서 쓴 파일이 없고 outDir도 그대로면 기존 값을 유지해 두 번째 실행이 바이트 동일하다.
 * safeWrite가 매니페스트를 다시 쓰면 이 필드가 빠지므로 읽어 둔 값으로 복원한다.
 */
async function recordInitDir(
  root: string,
  outDir: string,
  prev: InitManifestView,
  outcomes: WriteOutcome[],
  now: Date,
  naming: TokenNaming,
): Promise<void> {
  const file = path.join(root, MANIFEST);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(await fs.readFile(file, "utf-8")) as Record<string, unknown>;
  } catch {
    return;
  }
  const wrote = outcomes.some((o) => o.status === "created" || o.status === "updated");
  const updatedAt =
    wrote || prev.outDir !== outDir || prev.updatedAt === undefined ? now.toISOString() : prev.updatedAt;
  if (parsed.outDir === outDir && parsed.updatedAt === updatedAt && parsed.naming === naming) return;
  await atomicWrite(file, `${JSON.stringify({ ...parsed, outDir, updatedAt, naming }, null, 2)}\n`);
}

const DELETED_SCAFFOLD_REASON ="사용자가 삭제한 파일은 다시 만들지 않음 (--force로 재생성)";
const RN_SCAFFOLD_REASON = "웹 스캐폴드 템플릿이라 만들지 않음";

async function fileExists(abs: string): Promise<boolean> {
  try {
    await fs.access(abs);
    return true;
  } catch {
    return false;
  }
}

interface InitManifestView {
  entries: Set<string>;
  /** 엔트리 키 → 마지막으로 쓴 내용의 sha256 */
  hashes: Map<string, string>;
  outDir?: string;
  updatedAt?: string;
  naming?: TokenNaming;
}

/** `.dsmith/init.json`에서 엔트리 키와 init이 덧붙이는 `outDir`·`updatedAt`·`naming`을 읽는다(없거나 깨졌으면 빈 값). */
async function readInitManifest(file: string): Promise<InitManifestView> {
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf-8")) as {
      entries?: Record<string, { sha256?: unknown } | null>;
      outDir?: unknown;
      updatedAt?: unknown;
      naming?: unknown;
    };
    const hashes = new Map<string, string>();
    for (const [key, entry] of Object.entries(parsed.entries ?? {})) {
      if (typeof entry?.sha256 === "string") hashes.set(key, entry.sha256);
    }
    return {
      entries: new Set(Object.keys(parsed.entries ?? {})),
      hashes,
      ...(typeof parsed.outDir === "string" ? { outDir: parsed.outDir } : {}),
      ...(typeof parsed.updatedAt === "string" ? { updatedAt: parsed.updatedAt } : {}),
      ...(parsed.naming === "ds" || parsed.naming === "legacy" ? { naming: parsed.naming } : {}),
    };
  } catch {
    return { entries: new Set(), hashes: new Map() };
  }
}

interface OwnedTokenFiles {
  dir: string;
  json: string | null;
  css: string | null;
}

/**
 * 디렉터리의 init 소유 tokens.json·tokens.css 텍스트. "init 소유" = 매니페스트에 그 파일 엔트리가 있거나
 * (css) 첫 줄 / (json) `$description`에 GENERATED_NOTICE가 있음. 사용자 자신의 토큰 파일은 null.
 */
async function readOwnedTokenFiles(root: string, dir: string, prev: InitManifestView): Promise<OwnedTokenFiles> {
  const read = async (name: string, owned: (text: string) => boolean): Promise<string | null> => {
    const rel = dir === "." ? name : `${dir}/${name}`;
    const text = await fs.readFile(path.join(root, rel), "utf-8").catch(() => null);
    if (text === null) return null;
    return prev.entries.has(rel) || owned(text) ? text : null;
  };
  return {
    dir,
    json: await read("tokens.json", (t) => t.includes(GENERATED_NOTICE)),
    css: await read("tokens.css", (t) => (t.split(/\r?\n/, 1)[0] ?? "").includes(GENERATED_NOTICE)),
  };
}

/**
 * 토큰 이름 형식 판정(순서): 명시 > 커밋된 init 소유 토큰 파일(outDir, 다음 이전 outDir) > `.dsmith/init.json`의 naming > 기본 "ds".
 * 이전 산출을 읽을 때 쓴 디렉터리 파일도 함께 돌려준다(값 비교용).
 */
async function resolveNaming(
  root: string,
  outDir: string,
  prev: InitManifestView,
  explicit: TokenNaming | undefined,
): Promise<{ naming: InitResult["naming"]; previous: OwnedTokenFiles | null }> {
  const dirs = [outDir, ...(prev.outDir !== undefined && prev.outDir !== outDir ? [prev.outDir] : [])];
  let previous: OwnedTokenFiles | null = null;
  let detected: TokenNaming | null = null;
  for (const dir of dirs) {
    const files = await readOwnedTokenFiles(root, dir, prev);
    if (files.css !== null && previous === null) previous = files;
    const found = detectNamingFromFiles(files);
    if (found !== null) {
      detected = found;
      previous ??= files;
      break;
    }
  }
  if (explicit !== undefined) return { naming: { value: explicit, source: "explicit" }, previous };
  if (detected !== null) return { naming: { value: detected, source: "token-files" }, previous };
  if (prev.naming !== undefined) return { naming: { value: prev.naming, source: "manifest" }, previous };
  return { naming: { value: DEFAULT_TOKEN_NAMING, source: "default" }, previous };
}

const normalizedKey = (t: { normalized: unknown }): string => JSON.stringify(t.normalized);

/** 이전 init 소유 tokens.css 대비 의미 이름 기준으로 값이 바뀌거나 사라진 토큰(이전 파일 순서). 접두만 다른 경우는 대상이 아님 */
function changedTokens(previousCss: string, nextCss: string): InitResult["renamedTokens"] {
  const next = new Map(readCssVariableTokens(nextCss, "tokens.css").map((t) => [semanticNameOf(t.name), t]));
  const out: InitResult["renamedTokens"] = [];
  for (const old of readCssVariableTokens(previousCss, "tokens.css")) {
    const now = next.get(semanticNameOf(old.name));
    if (now !== undefined && normalizedKey(now) === normalizedKey(old)) continue;
    out.push({ name: old.name, from: old.value, to: now === undefined ? null : now.value });
  }
  return out;
}

const DRAFT_GROUPS = ["color", "space", "radius", "text"] as const;

/**
 * 이전 init 소유 tokens.css·tokens.json의 토큰을 `fresh.naming` 이름으로 옮긴 초안(이전 파일 순서·값 그대로).
 * 이전 형식이 이미 같거나, 파일을 해석할 수 없거나, tokens.css와 tokens.json의 토큰이 어긋나면 null(= index에서 새로 만든 초안을 쓴다).
 * 매핑은 fresh 것을 그대로 둔다(파일에는 안 들어가고 요약·커버리지에만 쓴다).
 */
function renamedDraft(previous: OwnedTokenFiles, fresh: TokenDraft): TokenDraft | null {
  if (previous.css === null || previous.json === null) return null;
  if (detectNamingFromFiles(previous) === fresh.naming) return null;
  let root: Record<string, unknown>;
  try {
    root = JSON.parse(previous.json) as Record<string, unknown>;
  } catch {
    return null;
  }
  const tokens: TokenDraft["tokens"] = [];
  for (const t of readCssVariableTokens(previous.css, "tokens.css")) {
    const semantic = semanticNameOf(t.name);
    const group = DRAFT_GROUPS.find((g) => semantic.startsWith(`${g}-`));
    if (group === undefined) return null;
    const key = semantic.slice(group.length + 1);
    const node = (root[group] as Record<string, unknown> | undefined)?.[key] as { $extensions?: Record<string, unknown> } | undefined;
    const ext = node?.$extensions?.["dev.dsmith"] as { category?: unknown; usageCount?: unknown; members?: unknown; chosen?: unknown } | undefined;
    if (ext === undefined || typeof ext.category !== "string" || typeof ext.usageCount !== "number" || !Array.isArray(ext.members)) return null;
    tokens.push({
      category: t.category,
      group,
      key,
      name: semantic,
      cssVar: cssVarName(group, key, fresh.naming),
      value: t.value,
      normalized: t.normalized,
      usageCount: ext.usageCount,
      members: ext.members as string[],
      ...(typeof ext.chosen === "string" ? { chosen: ext.chosen } : {}),
      ...(t.normalized.kind === "length" ? { unit: "px" as const } : {}),
    });
  }
  return tokens.length === 0 ? null : { ...fresh, tokens };
}

/** 스캐폴드 첫 줄 `// dsmith init 스캐폴드 — Name (결정: X)` / `(추천: X, 결정 전)`에서 X(기준 옵션)를 읽는다. */
function scaffoldOrigin(text: string): string | null {
  const m = /^\/\/ dsmith init 스캐폴드 — \S+ \((?:결정|추천): (.+?)(?:, 결정 전)?\)/.exec(text);
  return m?.[1] ?? null;
}

/**
 * `.dsmith/catalog.json`이 이 산출 디렉터리(init 소스)를 담고 있으면 토큰과 토큰 파일 해시를 방금 쓴 파일 기준으로 맞춘다.
 * 그러지 않으면 `decide --choose` 뒤 `init`으로 토큰 파일이 바뀌어도 카탈로그가 옛 값을 계속 내놓는다.
 * 컴포넌트·AGENTS.md는 건드리지 않는다(`dsmith ai`의 일).
 */
async function refreshCatalog(root: string, outDir: string, dsTokenFiles: string[]): Promise<"refreshed" | "current" | "needs-ai"> {
  const catalog = await readCatalog(root).catch(() => null);
  const covers = catalog?.sources.some((s) => s.origin === "init" && (s.dir ?? "") === `${outDir}/components`) === true;
  if (catalog === null || !covers) return "needs-ai";
  const initTokens = `${outDir}/tokens.json`;
  const read = await readCatalogTokens(root, [...new Set([...dsTokenFiles, initTokens])]);
  const next = {
    ...catalog,
    sources: withTokenFiles(catalog.sources, read.files, initTokens),
    tokens: read.tokens,
    stats: { ...catalog.stats, tokens: read.tokens.length },
  };
  if (JSON.stringify(next) === JSON.stringify(catalog)) return "current";
  await writeCatalog(root, next);
  return "refreshed";
}

const byCountThenFile =(a: { file: string; count: number }, b: { file: string; count: number }): number =>
  b.count - a.count || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0);

export async function runInit(opts: InitOptions): Promise<InitResult> {
  const root = path.resolve(opts.root);
  const index = await readIndex(root);
  const detected = await readDetect(root);
  if (index === null || detected === null) throw new Error(NEED_AUDIT);
  const outDir = normalizeOutDir(root, opts.outDir);
  const dryRun = opts.dryRun === true;
  const isDsModule = (m: string): boolean => isDsSpecifier(m, detected.ds);
  // react-native: CSS 토큰·Tailwind 프리셋·웹 스캐폴드를 만들지 않는다. 쓰이는 JS 테마가 있으면 토큰 파일도 만들지 않고 그 테마를 쓴다.
  const reactNative = detected.framework.name === "react-native";
  const jsThemeFiles = reactNative ? (detected.ds.jsThemes ?? []).map((t) => t.file) : [];
  const themeMode = jsThemeFiles.length > 0;

  // 2. 결정 읽기 → token-cluster 선택
  const decisions = await readDecisions(root);
  const colorChoices: Record<string, string> = {};
  for (const r of decisions.items) {
    if (r.kind === "token-cluster" && r.status === "decided" && r.chosen !== undefined) colorChoices[r.item] = r.chosen;
  }

  // 3. 토큰 이름 형식 판정 → 토큰 초안
  const prevManifest = await readInitManifest(path.join(root, MANIFEST));
  const resolved = await resolveNaming(root, outDir, prevManifest, opts.naming);
  const naming = resolved.naming;
  // 테마 모드는 쓸 토큰이 없다(초안 비움). 토큰 수·커버리지는 아래 themeTokens(그 테마)로 센다.
  const fresh: TokenDraft = themeMode
    ? { tokens: [], mappings: [], naming: naming.value }
    : buildTokenDraft(index.styles, { excludeDirs: [outDir], colorChoices, naming: naming.value });
  const themeTokens = themeMode
    ? (await loadReplacementTokens(root, detected.ds.tokenFiles, { framework: detected.framework.name })).tokens.filter(
        (t) => t.js !== undefined && t.file !== undefined && jsThemeFiles.includes(t.file),
      )
    : [];
  // 명시 naming으로 이전 파일과 다른 형식을 요청하는 흐름(migrate --rename-prefix·--revert)은 이름만 바꾼다: 이미 코드가 var()로 쓰는 토큰이
  // index가 바뀌어(migrate 적용 뒤) 사라지거나 값이 달라지지 않게 이전 토큰 파일의 토큰을 그대로 옮긴다
  const draft: TokenDraft = (!reactNative && opts.naming !== undefined && resolved.previous !== null ? renamedDraft(resolved.previous, fresh) : null) ?? fresh;

  // 4. pending 결정 시드
  const clusters = draft.tokens
    .filter((t) => t.category === "color" && t.members.length >= 2)
    .map((t) => ({ item: t.key, options: t.members }));
  const seeded = seedDecisions(decisions, index, clusters);
  // 클러스터 구성원이 바뀌었으면 pending token-cluster 기록의 options를 새로 맞춘다(decided 기록은 건드리지 않는다).
  let refreshedFile = seeded.file;
  let refreshed = 0;
  for (const c of clusters) {
    const record = refreshedFile.items.find((r) => r.item === c.item && r.kind === "token-cluster");
    if (record === undefined || record.status !== "pending") continue;
    if (record.options.length === c.options.length && record.options.every((o, i) => o === c.options[i])) continue;
    refreshedFile = recordDecision(refreshedFile, { ...record, options: c.options });
    refreshed += 1;
  }
  const seed = { file: refreshedFile, added: seeded.added };

  // 5. 스캐폴드 대상
  const listed = listDecisions(index, seed.file);
  const decidedOf = (item: string, kind: DecisionKind): boolean =>
    listed.some((l) => l.item === item && l.kind === kind && l.status === "decided" && l.stale !== true);
  const targets: Target[] = [];
  if (opts.all === true) {
    const top = opts.top ?? DEFAULT_TOP;
    const candidates = decisionCandidates(index).filter((c) => c.kind !== "token-cluster");
    for (const c of candidates.slice(0, top)) {
      if (c.kind === "token-cluster") continue;
      targets.push({ item: c.item, kind: c.kind, basis: decidedOf(c.item, c.kind) ? "decided" : "recommended" });
    }
  } else {
    for (const l of listed) {
      if (l.kind === "token-cluster" || l.status !== "decided" || l.stale === true) continue;
      targets.push({ item: l.item, kind: l.kind, basis: "decided" });
    }
  }

  const summaries = summarizeComponents(index.components);
  const planned = new Map<string, PlannedWrite>();
  const scaffolds: Omit<InitScaffold, "status">[] = [];
  const skippedScaffolds: InitResult["skippedScaffolds"] = [];
  const warnings: string[] = [];
  const tokensRef = `${outDir}/tokens.css`;

  if (reactNative) {
    // 스캐폴드 템플릿은 웹(div·className·tokens.css)용이다
    skippedScaffolds.push({ item: "react-native", reason: RN_SCAFFOLD_REASON });
    const owned = await readOwnedTokenFiles(root, outDir, prevManifest);
    if (owned.css !== null || owned.json !== null) {
      warnings.push(`react-native 레포에서는 ${outDir}/tokens.css·tokens.json을 쓰지 않음 — 필요 없으면 지워도 됨`);
    }
  }

  for (const target of reactNative ? [] : targets) {
    const name = target.item;
    if (!COMPONENT_NAME.test(name)) {
      skippedScaffolds.push({ item: name, reason: "파일 이름으로 쓸 수 없는 컴포넌트 이름" });
      continue;
    }
    const explained = await explainDecision(root, index, name, {
      isDsModule,
      decisions: seed.file,
      git: false,
      kind: target.kind,
    });
    if ("error" in explained) {
      skippedScaffolds.push({ item: name, reason: explained.error === "not-found" ? explained.message : "종류가 모호함" });
      continue;
    }
    const { card } = explained;
    const decidedChosen = card.decided?.chosen;
    const decidedValid = decidedChosen !== undefined && card.options.some((o) => o.id === decidedChosen);
    const chosenId = decidedValid ? decidedChosen : card.recommendation.optionId;
    const basis: Target["basis"] = decidedValid ? "decided" : target.basis === "decided" ? "decided" : "recommended";
    const option = card.options.find((o) => o.id === chosenId);
    if (option === undefined) {
      skippedScaffolds.push({ item: name, reason: "고른 옵션을 카드에서 찾지 못함" });
      continue;
    }
    if (option.isDs) {
      skippedScaffolds.push({ item: name, reason: `이미 DS에 있음: ${option.module ?? option.id}` });
      continue;
    }
    const file = `${outDir}/components/${name}.tsx`;
    if (planned.has(file)) {
      skippedScaffolds.push({ item: name, reason: `이름 충돌: ${file}` });
      continue;
    }
    // 매니페스트에 있는데 파일이 없다 = 사용자가 지운 스캐폴드. --force가 아니면 다시 만들지 않는다.
    if (opts.force !== true && prevManifest.entries.has(file) && !(await fileExists(path.join(root, file)))) {
      skippedScaffolds.push({ item: name, reason: DELETED_SCAFFOLD_REASON });
      continue;
    }

    // props: 사용처 합집합 ∪ 정의 파일(타입·required·values는 정의 파일 우선)
    const props = new Map<string, ScaffoldProp>();
    const sameName = summaries.filter((s) => s.name === name);
    for (const s of sameName) for (const p of s.props) props.set(p, { name: p });
    if (option.file !== undefined) {
      let defined: ComponentProps | null = null;
      try {
        defined = readComponentProps(await fs.readFile(path.join(root, option.file), "utf-8"), option.file, name);
      } catch {
        defined = null;
      }
      for (const p of defined?.props ?? []) {
        props.set(p.name, {
          name: p.name,
          ...(p.type === undefined ? {} : { type: p.type }),
          ...(p.required === undefined ? {} : { required: p.required }),
          ...(p.values === undefined ? {} : { values: p.values }),
        });
      }
    }
    const usesByFile = new Map<string, number>();
    for (const s of sameName) for (const f of s.files) usesByFile.set(f.file, (usesByFile.get(f.file) ?? 0) + f.count);
    const topUses = [...usesByFile.entries()]
      .map(([f, count]) => ({ file: f, count }))
      .sort(byCountThenFile)
      .slice(0, TOP_USES);

    // 이미 있는 스캐폴드: init이 쓴 뒤 그대로(해시 == 매니페스트)면 dsmith 소유로 보고 새 기준으로 다시 만든다(managed).
    // 사용자가 고쳤으면 create-only로 두어 건드리지 않는다.
    const existing = await fs.readFile(path.join(root, file), "utf-8").catch(() => null);
    const recorded = prevManifest.hashes.get(file);
    const untouched = existing !== null && recorded !== undefined && managedFileHash(existing) === recorded;
    if (existing !== null && !untouched) {
      const was = scaffoldOrigin(existing);
      if (was !== null && was !== chosenId) {
        warnings.push(
          `스캐폴드 ${file}은 다른 선택지(${was}) 기준으로 만들어진 뒤 고쳐져 있어 갱신하지 않음 (이번 ${basis === "decided" ? "결정" : "추천"}: ${chosenId}) — 새 기준이 필요하면 파일을 지우고 \`--force\`로 다시 실행(토큰 파일도 덮어씀)`,
        );
      }
    }
    planned.set(file, {
      file: path.join(root, file),
      region: { kind: "file" },
      ...(untouched ? {} : { mode: "create-only" as const }),
      content: renderScaffold({ name, item: name, basis, from: chosenId, props: [...props.values()], topUses, tokensRef }),
    });
    scaffolds.push({ item: name, name, file, from: chosenId, basis });
  }

  // 6. 쓰기. 토큰 3종은 managed, 스캐폴드는 create-only.
  const manifestFile = path.join(root, MANIFEST);
  const tokenWrite = (name: string, content: string): PlannedWrite => ({
    file: path.join(root, outDir, name),
    region: { kind: "file" },
    content,
  });
  // 웹: json·css·ts 한 묶음. react-native: JS 테마가 있으면 없음, 없으면 RN 형식 tokens.ts 하나
  const tokenWrites: PlannedWrite[] = reactNative
    ? themeMode
      ? []
      : [tokenWrite("tokens.ts", emitTokensTsRn(draft))]
    : [
        tokenWrite("tokens.json", serializeW3c(draft)),
        tokenWrite("tokens.css", emitTokensCss(draft)),
        tokenWrite("tokens.ts", emitTokensTs(draft)),
      ];
  const safeOpts = {
    manifestFile,
    displayRoot: root,
    confineTo: root,
    force: opts.force === true,
    tool: "init",
    version: opts.version,
  };

  // json·css·ts는 한 묶음이다: 하나라도 막히면(사용자 수정 등) 나머지도 쓰지 않아 세 파일이 어긋나지 않게 한다.
  const preflight = tokenWrites.length === 0 ? { outcomes: [] as WriteOutcome[] } : await safeWrite(tokenWrites, { ...safeOpts, dryRun: true });
  const blockers = tokenWrites.filter((_, i) => (preflight.outcomes[i] as WriteOutcome).status.startsWith("skipped"));
  const blocked = blockers.length > 0;
  const held = new Map<string, WriteOutcome>();
  let tokenHold: InitResult["tokenHold"] = null;

  // 이전 init 소유 tokens.css 대비 값이 바뀌거나 사라지는 토큰. migrate 적용 기록이 있으면 var() 참조가 다른 값을 가리키게 되므로 묶음을 보류한다.
  const renamedTokens =
    reactNative || resolved.previous?.css === null || resolved.previous === null
      ? []
      : changedTokens(resolved.previous.css, emitTokensCss(draft));
  const hasApplied = renamedTokens.length > 0 && (await listMigrations(root)).some((m) => m.status === "applied");
  const renamedHold = !blocked && hasApplied && opts.force !== true;
  const renamedReason = `토큰 ${renamedTokens.length}개의 값이 바뀌거나 사라져 함께 보류 — migrate로 적용한 var() 참조가 다른 값을 가리키게 됨, 덮어쓰려면 --force`;
  if (renamedHold) {
    tokenHold = "renamed";
    tokenWrites.forEach((w, i) => {
      const o = preflight.outcomes[i] as WriteOutcome;
      held.set(
        w.file,
        o.status === "created" || o.status === "updated" ? { ...o, status: "skipped-modified", reason: renamedReason } : o,
      );
    });
    const shown = renamedTokens
      .slice(0, 5)
      .map((t) => `${t.name}: ${t.to === null ? "사라짐" : `${t.from} → ${t.to}`}`)
      .join(", ");
    warnings.push(
      `토큰 묶음 보류: ${shown}${renamedTokens.length > 5 ? ` 외 ${renamedTokens.length - 5}개` : ""} — 덮어쓰려면 --force`,
    );
  } else if (renamedTokens.length > 0) {
    const shown = renamedTokens
      .slice(0, 5)
      .map((t) => `${t.name}: ${t.to === null ? "사라짐" : `${t.from} → ${t.to}`}`)
      .join(", ");
    warnings.push(
      `init 재실행으로 토큰 ${renamedTokens.length}개의 값이 바뀌거나 사라짐: ${shown}${renamedTokens.length > 5 ? ` 외 ${renamedTokens.length - 5}개` : ""} — 이 이름을 직접 쓴 코드가 있으면 확인`,
    );
  }
  if (blocked) {
    const names = blockers.map((w) => path.basename(w.file));
    const blockerOutcomes = blockers.map((w) => preflight.outcomes[tokenWrites.indexOf(w)] as WriteOutcome);
    // safeWrite의 '끊어진 심볼릭 링크'는 사용자 수정이 아니라 경로 문제다 — --force로도 쓸 수 없다.
    const brokenLink = (o: WriteOutcome): boolean => o.status === "skipped-invalid" && o.reason === "끊어진 심볼릭 링크";
    const allInvalid = blockerOutcomes.every((o) => o.status === "skipped-invalid");
    tokenHold = allInvalid ? "invalid" : "modified";
    const cause = blockerOutcomes.every(brokenLink) ? "심볼릭 링크가 깨짐" : allInvalid ? "쓸 수 없음" : "사용자 수정";
    tokenWrites.forEach((w, i) => {
      const o = preflight.outcomes[i] as WriteOutcome;
      if (o.status === "created" || o.status === "updated") {
        held.set(w.file, {
          file: o.file,
          key: o.key,
          region: o.region,
          status: "skipped-modified",
          reason:
            tokenWrites.length === 1
              ? `${names.join("·")} ${cause}으로 보류 (이 파일은 수정되지 않음)${allInvalid ? "" : ", 덮어쓰려면 --force"}`
              : `${names.join("·")} ${cause}으로 함께 보류 (이 파일은 수정되지 않음) — 세 토큰 파일은 함께 써야 함${allInvalid ? "" : ", 덮어쓰려면 --force"}`,
        });
      } else {
        held.set(w.file, brokenLink(o) ? { ...o, reason: "심볼릭 링크가 깨짐" } : o);
      }
    });
  }
  // Tailwind 프리셋은 토큰 3파일 묶음 밖의 managed 단독 write다(사람이 고쳐도 토큰 파일은 정상 갱신).
  const tailwindDetected = !reactNative && detected.styling.methods.some((m) => m.name === "tailwind");
  const tailwindVersion = detected.styling.tailwindVersion;
  let presetWrite: PlannedWrite | null = null;
  let presetVersion: 3 | 4 | null = null;
  let presetRel: string | null = null;
  if (tailwindDetected && tailwindVersion === undefined) {
    warnings.push("Tailwind 버전을 알 수 없어 프리셋을 만들지 않음");
  } else if (tailwindDetected && tailwindVersion !== undefined) {
    const format = presetFormatFor(tailwindVersion, await findTailwindConfig(root));
    const name = presetFileName(format);
    presetVersion = tailwindVersion;
    presetRel = `${outDir}/${name}`;
    presetWrite = tokenWrite(name, emitTailwindPreset(draft, format, { outDir }));
    // 확장자 없는 import는 .cjs와 .ts가 함께 있으면 .cjs를 먼저 집는다 — 다른 형식의 옛 파일은 지우지 않고 알린다.
    if (tailwindVersion === 3) {
      // config가 확장자를 명시해 가리키면(`…/tailwind.preset.cjs`) 어느 파일을 집을지 모호하지 않으니 경고하지 않는다.
      const configFile = await findTailwindConfig(root);
      const configText = configFile === null ? "" : await fs.readFile(path.join(root, configFile), "utf-8").catch(() => "");
      const explicit = /tailwind\.preset\.(?:ts|cjs)["'`]/.test(configText);
      for (const other of ["tailwind.preset.ts", "tailwind.preset.cjs"]) {
        if (other !== name && !explicit && (await fileExists(path.join(root, outDir, other)))) {
          warnings.push(`옛 프리셋 ${outDir}/${other}이 남아 있음 — 확장자 없는 import가 그 파일을 먼저 집을 수 있으니 지우세요`);
        }
      }
    }
    if (tailwindVersion === 4 && naming.value === "legacy") {
      warnings.push(
        "Tailwind 4: 토큰 이름이 이전 형식(--color-*·--text-*·--radius-*)이라 Tailwind 4 기본 테마 변수를 가림 — dsmith migrate --rename-prefix로 --ds- 접두로 바꾸세요",
      );
    }
  }

  // 값이 바뀌는 재실행 보류는 프리셋도 함께 묶는다(프리셋 값이 새 이름을 가리키므로)
  let presetInToWrite = presetWrite;
  if (renamedHold && presetWrite !== null) {
    const o = (await safeWrite([presetWrite], { ...safeOpts, dryRun: true })).outcomes[0] as WriteOutcome;
    held.set(
      presetWrite.file,
      o.status === "created" || o.status === "updated" ? { ...o, status: "skipped-modified", reason: renamedReason } : o,
    );
    presetInToWrite = null;
  }

  const toWrite: PlannedWrite[] = [
    ...(blocked || renamedHold ? [] : tokenWrites),
    ...planned.values(),
    ...(presetInToWrite ? [presetInToWrite] : []),
  ];
  const written = await safeWrite(toWrite, { ...safeOpts, dryRun });
  const outcomeOf = new Map<string, WriteOutcome>();
  toWrite.forEach((w, i) => outcomeOf.set(w.file, written.outcomes[i] as WriteOutcome));
  for (const [file, o] of held) outcomeOf.set(file, o);
  const outcomes = [...tokenWrites, ...planned.values(), ...(presetWrite ? [presetWrite] : [])].map(
    (w) => outcomeOf.get(w.file) as WriteOutcome,
  );
  let tailwindPreset: InitResult["tailwindPreset"] = null;
  if (presetVersion !== null && presetRel !== null) {
    // 프리셋 파일의 존재와 무관하게 판정한다(첫 dry-run에서는 파일이 아직 없다).
    tailwindPreset = { version: presetVersion, file: presetRel, linked: await isPresetLinked(root, outDir, presetVersion) };
  }

  // tokens.css를 쓴(또는 이미 같은) 실행만 로드 여부를 본다 — 보류된 실행은 새로 쓴 파일이 아니다
  const cssStatus = reactNative ? null : (outcomes[1] as WriteOutcome).status;
  const tokensLoaded: InitResult["tokensLoaded"] =
    cssStatus === "created" || cssStatus === "updated" || cssStatus === "unchanged"
      ? await findTokensStylesheetImport(root, {
          initDir: outDir,
          themeLinked: tailwindPreset !== null && tailwindPreset.version === 4 && tailwindPreset.linked,
          exclude: excludeGlobs(detected.overrides),
        })
      : null;

  // 7. 커버리지
  const coverage = draftCoverage(index.styles, themeMode ? themeTokens : draftToTokens(draft), { excludeDirs: [outDir] });

  // 9. 결정 요약
  const after = listDecisions(index, seed.file);
  const decisionSummary = {
    added: seed.added.length,
    refreshed,
    pending: after.filter((i) => i.status === "pending").length,
    decided: after.filter((i) => i.status === "decided").length,
    stale: after.filter((i) => i.stale === true).length,
  };

  const statusOfFile = new Map(outcomes.map((o, i) => [i, o.status] as const));
  const scaffoldResults: InitScaffold[] = scaffolds.map((s, i) => ({
    ...s,
    status: statusOfFile.get(tokenWrites.length + i) as WriteStatus,
  }));

  const count = (category: string): number =>
    (themeMode ? themeTokens : draft.tokens).filter((t) => t.category === category).length;
  const result: InitResult = {
    outDir,
    tokens: {
      color: count("color"),
      spacing: count("spacing"),
      radius: count("radius"),
      fontSize: count("font-size"),
      total: themeMode ? themeTokens.length : draft.tokens.length,
      mergedValues: themeMode ? themeTokens.length : draft.tokens.reduce((n, t) => n + t.members.length, 0),
    },
    tokenSource: themeMode
      ? { kind: "js-theme", files: jsThemeFiles }
      : { kind: "init-files", files: tokenWrites.map((w) => path.posix.join(outDir, path.basename(w.file))) },
    reactNative,
    coverage,
    mappings: draft.mappings,
    scaffolds: scaffoldResults,
    skippedScaffolds,
    decisions: decisionSummary,
    alphaDropped: themeMode ? [] : alphaDropped(index.styles, outDir),
    coverageScope: coverageScope(index.styles, outDir),
    all: opts.all === true,
    outcomes,
    report: null,
    manifest: MANIFEST,
    dryRun,
    warnings,
    tokenHold,
    naming,
    renamedTokens,
    tailwindPreset,
    tokensLoaded,
    catalog: null,
  };

  // 8. dryRun이 아니면 결정 시드와 리포트를 쓴다(.dsmith 안은 atomicWrite).
  if (!dryRun) {
    if (seed.added.length > 0 || refreshed > 0) await writeDecisions(root, seed.file);
    await recordInitDir(root, outDir, prevManifest, outcomes, opts.now ?? new Date(), naming.value);
    result.catalog = await refreshCatalog(root, outDir, detected.ds.tokenFiles);
    const report = `.dsmith/reports/init-${localDate(opts.now ?? new Date())}.md`;
    await atomicWrite(path.join(root, report), renderInitReport(result, draft));
    result.report = report;
  }
  return result;
}

export function formatInitSummary(r: InitResult): string {
  const t = r.tokens;
  const c = r.coverage;
  const lines: string[] = [];
  if (r.dryRun) lines.push("(dry-run — 아무것도 쓰지 않았습니다)");
  // 실제로 쓰였거나 이미 같은 내용인 토큰 파일만 "→ …"에 적는다.
  const fileNames = tokenFileNames(r);
  const tokenOutcomes = r.outcomes.slice(0, fileNames.length);
  const ok = fileNames.filter((_, i) => {
    const s = tokenOutcomes[i]?.status;
    return s === "created" || s === "updated" || s === "unchanged";
  });
  const target =
    ok.length === 0
      ? ""
      : ok.length === 3
        ? ` → ${r.outDir}/tokens.{json,css,ts}`
        : ` → ${ok.map((n) => `${r.outDir}/${n}`).join(", ")}`;
  if (r.tokenSource.kind === "js-theme") {
    lines.push(
      `토큰: 기존 JS 테마 사용 — ${r.tokenSource.files.join(", ")} (색 ${t.color} · 간격 ${t.spacing} · 모서리 ${t.radius} · 글꼴 크기 ${t.fontSize})`,
    );
  } else {
    lines.push(
      `토큰: 색 ${t.color} · 간격 ${t.spacing} · 모서리 ${t.radius} · 글꼴 크기 ${t.fontSize} (병합된 원값 ${t.mergedValues})${target}`,
    );
  }
  const rate = c.rate === null ? "해당 없음" : `${(c.rate * 100).toFixed(1)}%`;
  const alphaCount = r.alphaDropped.reduce((n, a) => n + a.count, 0);
  const alphaNote = alphaCount > 0 ? `, 알파 ${alphaCount}건 포함` : "";
  lines.push(
    c.total === 0
      ? "커버리지: 하드코딩 값이 없음"
      : `커버리지: 하드코딩 ${c.total}건 중 치환 가능 ${c.replaceable}건(${rate}) (같은 값/정확 ${c.byConfidence.exact}건은 migrate 기본, 근사 ${c.byConfidence.close}건은 --close${alphaNote})`,
  );
  if (r.alphaDropped.length > 0) {
    lines.push(`알파 제외: 투명도가 있는 색 ${r.alphaDropped.length}종은 토큰 값에서 알파가 빠짐 (리포트 참고)`);
  }
  const created = r.scaffolds.filter((s) => s.status === "created").length;
  const updated = r.scaffolds.filter((s) => s.status === "updated").length;
  const kept = r.scaffolds.filter((s) => s.status === "unchanged" || s.status === "skipped-exists").length;
  const skipped = r.skippedScaffolds.length;
  const skippedDetail =
    skipped === 0 ? "" : ` (${r.skippedScaffolds.map((s) => `${s.item} — ${s.reason}`).join("; ")})`;
  if (r.reactNative) {
    lines.push(`스캐폴드: 만들지 않음 (${r.skippedScaffolds.map((s) => `${s.item}: ${s.reason}`).join("; ")})`);
  } else {
    lines.push(`스캐폴드: 생성 ${created}${updated > 0 ? ` · 갱신 ${updated}` : ""} · 유지 ${kept} · 건너뜀 ${skipped}${skippedDetail}`);
  }
  if (r.tailwindPreset !== null) {
    const p = r.tailwindPreset;
    const how = p.version === 4 ? "진입 CSS에서 @import하면" : "tailwind.config의 presets에 추가하면";
    lines.push(
      `Tailwind 프리셋: ${p.file} — ${p.linked ? "연결됨" : `연결 안 됨: ${how} migrate가 클래스명(bg-ds-…)으로 치환`}`,
    );
  }
  if (!r.reactNative && r.naming.value === "legacy" && r.tailwindPreset?.version !== 4) {
    lines.push("토큰 이름: 이전 형식(접두 없음) — dsmith migrate --rename-prefix로 바꿀 수 있음");
  }
  if (r.tokensLoaded !== null && !r.tokensLoaded.css) lines.push(`참고: ${TOKENS_NOT_LOADED_NOTE(r.outDir)}`);
  for (const w of r.warnings) lines.push(`경고: ${w}`);
  const stale = r.decisions.stale > 0 ? `, stale ${r.decisions.stale}건` : "";
  // 힌트는 고를 것이 있을 때만(pending·stale)
  const open = r.decisions.pending > 0 || r.decisions.stale > 0;
  const hint = !open
    ? ""
    : r.reactNative
      ? " — /ds-decide 로 고르기"
      : r.all
      ? " — 스캐폴드는 추천안 기준, /ds-decide 로 확정한 뒤 다시 실행"
      : " — /ds-decide 로 고르거나 --all 로 추천안 사용";
  lines.push(`결정: pending ${r.decisions.pending}건${stale}${hint}`);
  if (r.tokenHold === "modified") {
    lines.push(
      r.reactNative
        ? "사람이 고친 토큰 파일 — 보류했습니다. 덮어쓰려면 --force"
        : "사람이 고친 토큰 파일 — 세 파일을 함께 보류했습니다. 덮어쓰려면 --force",
    );
  } else if (r.tokenHold === "invalid") {
    lines.push(
      r.reactNative
        ? "토큰 파일을 쓸 수 없는 경로라 보류했습니다 (--force로도 쓸 수 없음)"
        : "토큰 파일을 쓸 수 없는 경로가 있어 세 파일을 함께 보류했습니다 (--force로도 쓸 수 없음)",
    );
  } else if (r.tokenHold === "renamed") {
    lines.push(
      `migrate로 적용한 var() 참조가 있는데 토큰 ${r.renamedTokens.length}개의 값이 바뀌거나 사라져 토큰 묶음(과 Tailwind 프리셋)을 보류했습니다. 덮어쓰려면 --force`,
    );
  }
  for (const [i, o] of tokenOutcomes.entries()) {
    if (o.status === "skipped-invalid") {
      lines.push(`쓰지 못한 토큰 파일(skipped-invalid): ${fileNames[i]} — ${o.reason ?? "경로가 안전하지 않음"}`);
    }
  }
  if (r.catalog === "refreshed") lines.push("카탈로그: 토큰·토큰 파일 해시를 갱신함 (.dsmith/catalog.json) — 컴포넌트·AGENTS.md는 `dsmith ai`로 갱신");
  if (r.catalog === "needs-ai") lines.push("다음: dsmith ai");
  if (r.report !== null) lines.push(`리포트: ${r.report}`);
  if (r.dryRun) {
    for (const o of r.outcomes) {
      lines.push(`쓸 예정: ${o.file} (${o.status})`);
      if (o.diff !== undefined) lines.push(o.diff.trimEnd());
    }
  }
  return lines.join("\n");
}

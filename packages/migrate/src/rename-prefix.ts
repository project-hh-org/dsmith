import fs from "node:fs/promises";
import path from "node:path";
import {
  applyPatches,
  detectNamingFromFiles,
  findInitDir,
  listIndexableFiles,
  newMigrationId,
  readCssVariableTokens,
  semanticNameOf,
  sha256Text,
  validateEdit,
  writeMigration,
  writePatchedFile,
  type MigrationFile,
  type MigrationRecord,
  type TextPatch,
  type TokenNaming,
} from "@dsmith-dev/core";
import type { ApplyFileResult } from "./apply.js";

/** 토큰 이름을 담을 수 있는 소스 파일(core `tokens-loaded.ts`의 SOURCE_GLOB와 같다) */
const SOURCE_GLOB = "**/*.{css,scss,sass,less,html,htm,js,jsx,ts,tsx,mjs,cjs,mts,cts,vue,svelte,astro,mdx}";

export interface PrefixRename {
  /** "--color-blue-400" */
  from: string;
  /** "--ds-color-blue-400" */
  to: string;
}

export interface RenamePlan {
  /** 현재 init 산출 형식. "ds"면 renames·files 비어 있음 */
  naming: TokenNaming;
  initDir: string | null;
  /** init 소유 tokens.css 선언 순서 */
  renames: PrefixRename[];
  /** 파일 경로순 */
  files: { file: string; sha256: string; patches: TextPatch[]; refs: number }[];
  /** `var()` 밖 언급(문자열 "--color-blue-400", 사용자 CSS의 같은 이름 정의 등) — 바꾸지 않고 알림 */
  mentions: { file: string; line: number; name: string }[];
}

const NAME_CHAR = "[A-Za-z0-9_-]";
/** `var(` 뒤 공백 허용, 이름 뒤 `\s*[,)]` — `--color-blue-400-2`가 `--color-blue-400`으로 잡히지 않는다 */
const VAR_REF = new RegExp(`\\bvar\\(\\s*(--${NAME_CHAR}+)\\s*(?=[,)])`, "g");
const ANY_NAME = new RegExp(`(?<!${NAME_CHAR})(--${NAME_CHAR}+)(?!${NAME_CHAR})`, "g");

const lineOf = (text: string, offset: number): number => {
  let line = 1;
  for (let i = text.indexOf("\n"); i !== -1 && i < offset; i = text.indexOf("\n", i + 1)) line += 1;
  return line;
};

const readIfFile = (abs: string): Promise<string | null> => fs.readFile(abs, "utf-8").catch(() => null);

/** 소스 파일 목록: 기본 제외 + `exclude` + init 산출 디렉터리 밖 */
async function sourceFiles(root: string, initDir: string | null, exclude: string[]): Promise<string[]> {
  const initIgnore = initDir === null ? [] : initDir === "." ? ["tokens.*", "tailwind.preset.*", "tailwind.theme.css"] : [`${initDir}/**`];
  return listIndexableFiles(root, [], { include: [SOURCE_GLOB], exclude: [...exclude, ...initIgnore] });
}

/** 파일 텍스트에서 `var(<old>)` 참조 패치와 var() 밖 언급을 찾는다 */
function scan(text: string, map: Map<string, string>): { patches: TextPatch[]; mentions: { line: number; name: string }[] } {
  const patches: TextPatch[] = [];
  const inRef = new Set<number>();
  for (const m of text.matchAll(VAR_REF)) {
    const name = m[1] as string;
    const to = map.get(name);
    if (to === undefined) continue;
    const start = (m.index as number) + m[0].indexOf(name);
    patches.push({ start, end: start + name.length, replacement: to });
    inRef.add(start);
  }
  const mentions: { line: number; name: string }[] = [];
  for (const m of text.matchAll(ANY_NAME)) {
    const name = m[1] as string;
    if (!map.has(name) || inRef.has(m.index as number)) continue;
    mentions.push({ line: lineOf(text, m.index as number), name });
  }
  return { patches, mentions };
}

/**
 * 이전 형식(접두 없음) init 산출의 토큰 이름을 `--ds-` 접두로 바꾸는 계획. 아무것도 쓰지 않는다.
 * 대상 파일 = 소스 확장자 파일(기본 제외 + `exclude` + init 산출 디렉터리 밖). 패치 = `var(--old)` 참조의 이름만.
 */
export async function planPrefixRename(root: string, opts: { exclude: string[] }): Promise<RenamePlan> {
  const initDir = await findInitDir(root);
  const empty: RenamePlan = { naming: "ds", initDir, renames: [], files: [], mentions: [] };
  if (initDir === null) return empty;
  const at = (name: string): string => path.join(root, ...(initDir === "." ? [name] : [...initDir.split("/"), name]));
  const json = await readIfFile(at("tokens.json"));
  const css = await readIfFile(at("tokens.css"));
  const naming = detectNamingFromFiles({ json, css });
  if (naming !== "legacy" || css === null) return { ...empty, naming: naming ?? "ds" };

  const map = new Map<string, string>();
  const renames: PrefixRename[] = [];
  for (const t of readCssVariableTokens(css, "tokens.css")) {
    if (map.has(t.name)) continue;
    const to = `--ds-${semanticNameOf(t.name)}`;
    map.set(t.name, to);
    renames.push({ from: t.name, to });
  }

  const files: RenamePlan["files"] = [];
  const mentions: RenamePlan["mentions"] = [];
  for (const file of await sourceFiles(root, initDir, opts.exclude)) {
    const text = await readIfFile(path.join(root, file));
    if (text === null || !text.includes("--")) continue;
    const found = scan(text, map);
    for (const m of found.mentions) mentions.push({ file, ...m });
    if (found.patches.length > 0) files.push({ file, sha256: sha256Text(text), patches: found.patches, refs: found.patches.length });
  }
  return { naming, initDir, renames, files, mentions };
}

/**
 * 기록(kind "rename-prefix", status "applying")을 소스보다 먼저 쓰고, 파일마다 해시 일치 → 패치 → validateEdit → 해시 비교 쓰기.
 * apply.ts와 같은 상태 전이·사유. 검증에 실패한 파일은 쓰지 않는다(rolled-back).
 */
export async function applyPrefixRename(
  root: string,
  plan: RenamePlan,
  opts: { version: string; now?: Date },
): Promise<{ id: string; record: string; files: ApplyFileResult[] }> {
  const now = opts.now ?? new Date();
  const id = await newMigrationId(root, now);
  interface Prepared {
    file: RenamePlan["files"][number];
    result: ApplyFileResult;
    entry: MigrationFile;
    after?: string;
  }
  const prepared: Prepared[] = [];
  for (const fp of plan.files) {
    const result = (status: ApplyFileResult["status"], reason?: string): ApplyFileResult => ({
      file: fp.file,
      status,
      replacements: fp.refs,
      components: 0,
      props: 0,
      annotations: 0,
      ...(reason === undefined ? {} : { reason }),
    });
    const reject = (status: "rolled-back" | "changed-since-plan", reason: string): Prepared => ({
      file: fp,
      result: result(status, reason),
      entry: { file: fp.file, before: fp.sha256, after: fp.sha256, patches: [], status: "rolled-back", reason },
    });
    let current: string;
    try {
      current = await fs.readFile(path.resolve(root, fp.file), "utf-8");
    } catch (err) {
      prepared.push(reject("changed-since-plan", `파일을 읽을 수 없음: ${(err as Error).message}`));
      continue;
    }
    if (sha256Text(current) !== fp.sha256) {
      prepared.push(reject("changed-since-plan", "계획 뒤 파일이 바뀜"));
      continue;
    }
    let after: string;
    try {
      after = applyPatches(current, fp.patches);
    } catch (err) {
      prepared.push(reject("rolled-back", `패치 적용 실패: ${(err as Error).message}`));
      continue;
    }
    const check = validateEdit(fp.file, current, after);
    if (!check.ok) {
      prepared.push(reject("rolled-back", check.reason));
      continue;
    }
    prepared.push({
      file: fp,
      after,
      result: result("applied"),
      entry: {
        file: fp.file,
        before: fp.sha256,
        after: sha256Text(after),
        patches: fp.patches.map((p) => ({ ...p, original: current.slice(p.start, p.end) })),
        status: "pending",
      },
    });
  }

  const record: MigrationRecord = {
    version: 1,
    id,
    dsmith: opts.version,
    createdAt: now.toISOString(),
    status: "applying",
    kind: "rename-prefix",
    summary: { tokens: 0, components: 0, files: 0 },
    files: prepared.map((p) => p.entry),
  };
  const recordPath = await writeMigration(root, record);
  const summaryOf = (): MigrationRecord["summary"] => {
    const done = prepared.filter((p) => p.entry.status === "applied");
    return { tokens: done.reduce((n, p) => n + p.result.replacements, 0), components: 0, files: done.length };
  };

  for (const p of prepared) {
    if (p.entry.status !== "pending" || p.after === undefined) continue;
    let written: { written: boolean; reason?: string };
    try {
      written = await writePatchedFile(root, p.file.file, p.file.sha256, p.after);
    } catch (err) {
      written = { written: false, reason: `쓰기 실패: ${err instanceof Error ? err.message : String(err)}` };
      p.result.status = "write-failed";
    }
    if (written.written) {
      p.entry.status = "applied";
    } else {
      p.entry.status = "rolled-back";
      p.entry.reason = written.reason ?? "쓰지 못함";
      if (p.result.status !== "write-failed") p.result.status = written.reason === "계획 뒤 파일이 바뀜" ? "changed-since-plan" : "rolled-back";
      p.result.reason = p.entry.reason;
    }
    record.summary = summaryOf();
    await writeMigration(root, record);
  }
  record.status = "applied";
  record.summary = summaryOf();
  await writeMigration(root, record);
  return { id, record: recordPath, files: prepared.map((p) => p.result) };
}

/** 옛 이름의 `var()` 참조가 남은 곳(적용 뒤 확인). 계획과 같은 대상 파일 범위 */
export async function leftoverRefs(
  root: string,
  renames: PrefixRename[],
  opts: { exclude: string[] },
): Promise<{ file: string; line: number; name: string }[]> {
  const map = new Map(renames.map((r) => [r.from, r.to]));
  const initDir = await findInitDir(root);
  const out: { file: string; line: number; name: string }[] = [];
  for (const file of await sourceFiles(root, initDir, opts.exclude)) {
    const text = await readIfFile(path.join(root, file));
    if (text === null || !text.includes("--")) continue;
    for (const m of text.matchAll(VAR_REF)) {
      if (map.has(m[1] as string)) out.push({ file, line: lineOf(text, m.index as number), name: m[1] as string });
    }
  }
  return out;
}

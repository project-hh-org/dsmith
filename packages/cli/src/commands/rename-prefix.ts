import fs from "node:fs/promises";
import path from "node:path";
import { findInitDir, readIndex, readMigration, sha256Text, writeMigration, type MigrationRecord } from "@dsmith-dev/core";
import { excludeGlobs, readDetect } from "@dsmith-dev/detect";
import { runInit, type InitResult } from "@dsmith-dev/init";
import {
  applyPrefixRename,
  checkBranch,
  commitFiles,
  createBranch,
  leftoverRefs,
  planPrefixRename,
  revertMigration,
  type RenamePlan,
  type RevertResult,
} from "@dsmith-dev/migrate";
import { cliVersion } from "../version.js";
import { computeAudit, runAudit } from "./audit.js";
import type { MigrateCommandOptions, MigrateOutput } from "./migrate.js";

export const RENAME_COMMIT_MESSAGE = "refactor: 토큰 CSS 변수에 --ds- 접두 (dsmith migrate --rename-prefix)";

const CONFLICTING: [keyof MigrateCommandOptions, string][] = [
  ["files", "--files"],
  ["category", "--category"],
  ["only", "--only"],
  ["close", "--close"],
  ["maxFiles", "--max-files"],
];

/** `--rename-prefix`와 함께 쓸 수 없는 옵션이 있으면 Error */
export function assertRenamePrefixOptions(opts: MigrateCommandOptions): void {
  const used = CONFLICTING.filter(([key]) => {
    const v = opts[key];
    return v !== undefined && v !== false && !(Array.isArray(v) && v.length === 0);
  }).map(([, flag]) => flag);
  if (used.length > 0) throw new Error(`--rename-prefix는 ${used.join(", ")}와 함께 쓸 수 없습니다`);
  if (opts.list === true || opts.revert !== undefined) {
    throw new Error("--rename-prefix는 --list·--revert와 함께 쓸 수 없습니다 (되돌리기는 `dsmith migrate --revert <id>`)");
  }
}

const planJson = (plan: RenamePlan): unknown => ({
  naming: plan.naming,
  initDir: plan.initDir,
  renames: plan.renames,
  files: plan.files.map((f) => ({ file: f.file, refs: f.refs })),
  mentions: plan.mentions,
});

function formatRenamePlan(plan: RenamePlan, hint: boolean): string {
  const refs = plan.files.reduce((n, f) => n + f.refs, 0);
  const lines = [
    `토큰 이름 바꾸기: ${plan.renames.length}개 · 참조 ${refs}개 · 파일 ${plan.files.length}개 · var() 밖 언급 ${plan.mentions.length}개(바꾸지 않음)`,
  ];
  for (const f of plan.files.slice(0, 10)) lines.push(`  ${f.file} (참조 ${f.refs})`);
  if (plan.files.length > 10) lines.push(`  … 외 파일 ${plan.files.length - 10}개`);
  for (const m of plan.mentions.slice(0, 5)) lines.push(`  var() 밖 언급: ${m.file}:${m.line} ${m.name}`);
  if (plan.mentions.length > 5) lines.push(`  … 외 언급 ${plan.mentions.length - 5}개`);
  if (hint) lines.push("적용하려면 --apply (되돌리기: dsmith migrate --revert <id>)");
  return lines.join("\n");
}

/** init이 쓰게 되는(쓴) 파일 — root 상대. created·updated만 */
const writtenFiles = (init: InitResult): string[] => init.outcomes.filter((o) => o.status === "created" || o.status === "updated").map((o) => o.file);

function holdReason(init: InitResult): string {
  const reason = init.outcomes.find((o) => o.reason !== undefined)?.reason;
  return reason ?? init.warnings[0] ?? init.tokenHold ?? "";
}

async function loadAuditState(root: string): Promise<{ score: number }> {
  let detect = await readDetect(root);
  let index = await readIndex(root);
  if (detect === null || index === null) {
    process.stderr.write("인덱스가 없어 audit을 먼저 실행함\n");
    await runAudit(root);
    detect = await readDetect(root);
    index = await readIndex(root);
    if (detect === null || index === null) throw new Error("audit 뒤에도 .dsmith/detect.json·index.json을 읽을 수 없음");
  }
  return { score: computeAudit(detect, index).health.score };
}

/** `dsmith migrate --rename-prefix [--apply [--branch <name> [--with-tokens]]]` */
export async function runRenamePrefix(
  opts: MigrateCommandOptions,
  root: string,
  live: { branch: { name: string; base: string } | null },
): Promise<MigrateOutput> {
  assertRenamePrefixOptions(opts);
  const detect = await readDetect(root);
  const exclude = excludeGlobs(detect?.overrides);
  const plan = await planPrefixRename(root, { exclude });
  if (plan.initDir === null) throw new Error("init 산출물(tokens.json)을 찾을 수 없음 — dsmith init을 먼저 실행하세요");

  if (plan.naming === null) {
    return { json: { plan: planJson(plan), applied: null }, text: `토큰 파일을 찾지 못함 — ${plan.initDir}/ 에 init이 만든 tokens.json·tokens.css가 없음` };
  }
  if (plan.naming === "ds") {
    return { json: { plan: planJson(plan), applied: null }, text: "이미 --ds- 접두 형식입니다 — 바꿀 것이 없음" };
  }
  if (opts.apply !== true) {
    return { json: { plan: planJson(plan), applied: null }, text: formatRenamePlan(plan, true) };
  }

  const initDir = plan.initDir;
  const version = cliVersion();
  const before = await loadAuditState(root);

  // 아무것도 쓰기 전에: 토큰 파일이 보류되면(사용자 수정 등) 이름만 바꿀 수 없다
  const dry = await runInit({ root, version, outDir: initDir, naming: "ds", dryRun: true });
  if (dry.tokenHold !== null) throw new Error(`토큰 파일이 보류돼 이름을 바꿀 수 없음 (${holdReason(dry)})`);

  let branch: NonNullable<MigrationRecord["branch"]> | undefined;
  let tokenFilesToCommit: string[] = [];
  if (opts.branch !== undefined) {
    const check = await checkBranch(
      root,
      opts.branch,
      plan.files.map((f) => f.file),
      { tokenFiles: writtenFiles(dry), withTokens: opts.withTokens === true },
    );
    if (!check.ok) throw new Error(`--branch를 쓸 수 없음: ${check.reason}`);
    await createBranch(root, opts.branch);
    live.branch = { name: opts.branch, base: check.base };
    branch = { name: opts.branch, base: check.base, baseSha: check.baseSha, commit: null };
  }

  // 전부 아니면 전무: 이번 실행에서 쓴 것은 어느 단계에서 실패하든 되돌린다
  const tokenSnapshot = await snapshot(root, [...writtenFiles(dry), INIT_MANIFEST]);
  const applied = await applyPrefixRename(root, plan, { version });
  const rollBack = async (): Promise<void> => {
    await revertMigration(root, applied.id);
    await restore(root, tokenSnapshot);
  };
  const refuse = async (reason: string, extra: string[] = []) => {
    await rollBack();
    await runAudit(root);
    return {
      json: { plan: planJson(plan), applied, rolledBack: true, branch: branch ?? null },
      text: [reason, ...extra, "이번 실행에서 쓴 파일을 모두 되돌림 — 아무것도 바뀌지 않음", ...(branch === undefined ? [] : [`브랜치 ${branch.name}는 변경 없이 남아 있음`])].join("\n"),
      exitCode: 1,
    };
  };

  const notApplied = applied.files.filter((f) => f.status !== "applied");
  if (notApplied.length > 0) {
    return refuse(
      `쓰지 못한 파일이 ${notApplied.length}개 있음:`,
      notApplied.slice(0, 10).map((f) => `  ${f.file}: ${f.status}${f.reason === undefined ? "" : ` (${f.reason})`}`),
    );
  }
  let init: InitResult;
  try {
    init = await runInit({ root, version, outDir: initDir, naming: "ds" });
  } catch (err) {
    await rollBack();
    throw err;
  }
  if (init.tokenHold !== null) return refuse(`토큰 파일이 보류돼 이름을 바꿀 수 없음 (${holdReason(init)})`);
  tokenFilesToCommit = writtenFiles(init);
  const leftover = await leftoverRefs(root, plan.renames, { exclude });
  if (leftover.length > 0) {
    return refuse(
      `옛 이름의 var() 참조가 ${leftover.length}개 남음:`,
      leftover.slice(0, 10).map((l) => `  ${l.file}:${l.line} ${l.name}`),
    );
  }
  const appliedPaths = applied.files.map((f) => f.file);
  const refs = applied.files.reduce((n, f) => n + f.replacements, 0);

  const lines = [
    formatRenamePlan(plan, false),
    `적용: ${appliedPaths.length}개 파일 · 참조 ${refs}개 → 기록 ${applied.record}`,
    `토큰 파일: ${tokenFilesToCommit.length > 0 ? tokenFilesToCommit.join(", ") : "변경 없음"} (naming ${init.naming.value})`,
  ];
  let exitCode = 0;
  if (branch !== undefined) {
    try {
      const sha = await commitFiles(root, [...new Set([...appliedPaths, ...tokenFilesToCommit])], RENAME_COMMIT_MESSAGE);
      branch.commit = sha;
      const record = await readMigration(root, applied.id);
      if (record !== null) {
        record.branch = branch;
        await writeMigration(root, record);
      }
      lines.push(`브랜치 ${branch.name}에 커밋 ${sha.slice(0, 7)} — PR은 직접 여세요`);
    } catch (err) {
      exitCode = 1;
      lines.push(`커밋하지 못함: ${(err as Error).message} — 브랜치 ${branch.name}에 변경이 커밋되지 않은 채 남아 있음`);
    }
  }
  const { result: auditAfter } = await runAudit(root);
  lines.push(`점수 ${before.score} → ${auditAfter.health.score}`);
  if (await fs.access(path.join(root, ".dsmith", "guard.json")).then(() => true, () => false)) {
    lines.push("다음: dsmith guard init으로 스냅샷 갱신");
  }
  return {
    json: {
      plan: planJson(plan),
      applied,
      init: { naming: init.naming, tokenHold: init.tokenHold, files: tokenFilesToCommit },
      leftover,
      score: { before: before.score, after: auditAfter.health.score },
      branch: branch ?? null,
    },
    text: lines.join("\n"),
    exitCode,
  };
}

const INIT_MANIFEST = ".dsmith/init.json";

/** 파일 내용(없으면 null) 스냅샷 — 중간 실패 때 되돌리는 데 쓴다 */
async function snapshot(root: string, files: string[]): Promise<Map<string, string | null>> {
  const snap = new Map<string, string | null>();
  for (const file of new Set(files)) snap.set(file, await fs.readFile(path.join(root, file), "utf-8").catch(() => null));
  return snap;
}

async function restore(root: string, snap: Map<string, string | null>): Promise<void> {
  for (const [file, content] of snap) {
    const abs = path.join(root, file);
    if (content === null) await fs.rm(abs, { force: true });
    else await fs.writeFile(abs, content, "utf-8");
  }
}

/**
 * `--revert <id>`가 rename-prefix 기록이면 참조를 되돌린 뒤 토큰 파일을 이전 형식으로 다시 만든다. 기록이 rename-prefix가 아니면 null.
 * 전부 아니면 전무: 무엇이든 쓰기 전에 (a) 기록된 파일이 모두 적용 직후 해시 그대로인지, (b) init이 토큰 파일을 보류하지 않는지 확인하고,
 * 하나라도 어긋나면 아무것도 쓰지 않고 거부한다. 그 뒤 쓰는 도중 실패하면 이번 실행에서 쓴 것을 스냅샷으로 되돌린다.
 */
export async function revertRenamePrefix(root: string, id: string): Promise<{ result: RevertResult; init: InitResult | null; text: string[]; exitCode: number } | null> {
  const record = await readMigration(root, id);
  if (record === null || record.kind !== "rename-prefix") return null;

  const entries = record.files.filter((e) => e.status !== "rolled-back" && e.status !== "skipped-modified");
  const mismatched: RevertResult["files"] = [];
  for (const entry of entries) {
    const current = await fs.readFile(path.resolve(root, entry.file), "utf-8").catch(() => null);
    if (current === null) mismatched.push({ file: entry.file, status: "missing", reason: "파일이 없음" });
    else {
      const sha = sha256Text(current);
      if (sha !== entry.after && sha !== entry.before) mismatched.push({ file: entry.file, status: "skipped-modified", reason: "적용 뒤 수정됨" });
    }
  }
  if (mismatched.length > 0) {
    return { result: { id, files: mismatched }, init: null, text: ["아무것도 되돌리지 않음 — 위 파일이 적용 뒤 바뀌어 일부만 되돌리면 토큰 이름과 어긋남. 직접 고친 뒤 다시 --revert 하세요"], exitCode: 1 };
  }

  const version = cliVersion();
  const initDir = (await findInitDir(root)) ?? undefined;
  const initOpts = { root, version, ...(initDir === undefined ? {} : { outDir: initDir }), naming: "legacy" as const };
  const dry = await runInit({ ...initOpts, dryRun: true });
  if (dry.tokenHold !== null) {
    return { result: { id, files: [] }, init: null, text: [`토큰 파일이 보류돼 되돌릴 수 없음 (${holdReason(dry)}) — 아무것도 되돌리지 않음`], exitCode: 1 };
  }

  const snap = await snapshot(root, [...entries.map((e) => e.file), `.dsmith/migrations/${id}.json`, INIT_MANIFEST, ...writtenFiles(dry)]);
  const abort = async (text: string, result: RevertResult): Promise<{ result: RevertResult; init: null; text: string[]; exitCode: number }> => {
    await restore(root, snap);
    return { result, init: null, text: [`${text} — 이번 실행에서 쓴 파일을 모두 되돌림`], exitCode: 1 };
  };
  try {
    const result = await revertMigration(root, id);
    if (result.files.some((f) => f.status === "skipped-modified" || f.status === "missing")) return await abort("되돌리는 도중 파일이 바뀜", result);
    const init = await runInit(initOpts);
    if (init.tokenHold !== null) return await abort(`토큰 파일이 보류됨 (${holdReason(init)})`, result);
    const written = writtenFiles(init);
    return { result, init, text: [`토큰 파일을 이전 형식으로 되돌림: ${written.length > 0 ? written.join(", ") : "변경 없음"}`], exitCode: 0 };
  } catch (err) {
    await restore(root, snap);
    throw err;
  }
}

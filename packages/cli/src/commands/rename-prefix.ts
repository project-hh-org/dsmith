import fs from "node:fs/promises";
import path from "node:path";
import { findInitDir, readIndex, readMigration, writeMigration, type MigrationRecord } from "@dsmith-dev/core";
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

  const applied = await applyPrefixRename(root, plan, { version });
  const init = await runInit({ root, version, outDir: initDir, naming: "ds" });
  tokenFilesToCommit = writtenFiles(init);
  const leftover = await leftoverRefs(root, plan.renames, { exclude });
  const appliedPaths = applied.files.filter((f) => f.status === "applied").map((f) => f.file);
  const refs = applied.files.filter((f) => f.status === "applied").reduce((n, f) => n + f.replacements, 0);

  const lines = [
    formatRenamePlan(plan, false),
    `적용: ${appliedPaths.length}개 파일 · 참조 ${refs}개 → 기록 ${applied.record}`,
    `토큰 파일: ${tokenFilesToCommit.length > 0 ? tokenFilesToCommit.join(", ") : "변경 없음"} (naming ${init.naming.value})`,
  ];
  let exitCode = 0;
  if (leftover.length > 0) {
    exitCode = 1;
    lines.push(`옛 이름의 var() 참조가 ${leftover.length}개 남음 — 확인하세요:`);
    for (const l of leftover.slice(0, 10)) lines.push(`  ${l.file}:${l.line} ${l.name}`);
    if (leftover.length > 10) lines.push(`  … 외 ${leftover.length - 10}개`);
    lines.push(`되돌리려면 dsmith migrate --revert ${applied.id}`);
    if (branch !== undefined) lines.push(`브랜치 ${branch.name}에 변경이 커밋되지 않은 채 남아 있음`);
  } else if (branch !== undefined) {
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

/**
 * `--revert <id>`가 rename-prefix 기록이면 참조를 되돌린 뒤 토큰 파일을 이전 형식으로 다시 만든다.
 * 일부 참조가 남았으면(적용 뒤 수정됨) 토큰 파일은 건드리지 않는다. 기록이 rename-prefix가 아니면 null.
 */
export async function revertRenamePrefix(root: string, id: string): Promise<{ result: RevertResult; init: InitResult | null; text: string[]; exitCode: number } | null> {
  const record = await readMigration(root, id);
  if (record === null || record.kind !== "rename-prefix") return null;
  const result = await revertMigration(root, id);
  const notReverted = result.files.some((f) => f.status === "skipped-modified" || f.status === "missing");
  if (notReverted) {
    return { result, init: null, text: ["참조가 일부 남아 토큰 파일을 이전 형식으로 되돌리지 않음 — 남은 파일을 확인한 뒤 다시 --revert 하세요"], exitCode: 1 };
  }
  const initDir = (await findInitDir(root)) ?? undefined;
  const init = await runInit({ root, version: cliVersion(), ...(initDir === undefined ? {} : { outDir: initDir }), naming: "legacy" });
  const written = writtenFiles(init);
  return { result, init, text: [`토큰 파일을 이전 형식으로 되돌림: ${written.length > 0 ? written.join(", ") : "변경 없음"}`], exitCode: init.tokenHold === null ? 0 : 1 };
}

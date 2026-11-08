import { spawn } from "node:child_process";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildTokenRefResolver, extractorMatchers, loadReplacementTokens, moduleContextOf, sha256Text, type GuardSnapshot, type RefResolver } from "@dsmith-dev/core";
import { readDetect } from "@dsmith-dev/detect";
import { buildGuardSnapshot } from "@dsmith-dev/guard";
import { agentEnv } from "./agent.js";
import { extractorsFor } from "./extractors.js";
import type { Condition, RepoName } from "./model.js";
import { MONOREPO_ROOT, isInsideMonorepo } from "./paths.js";

export type { RepoName };

/**
 * builtin = 저장소 안의 공개 레포(합성 fixture·예제), external = 저장소 밖의 비공개 앱(경로는 `--repo-path` 또는 환경 변수, 커밋하지 않는다).
 * prompts = benchmarks/ 아래 프롬프트 폴더.
 */
export type RepoSpec = { kind: "builtin"; dir: string; prompts: string } | { kind: "external"; env: string; prompts: string };

export const REPOS = {
  "legacy-demo": { kind: "builtin", dir: "examples/legacy-demo", prompts: "prompts" },
  "with-ds-app": { kind: "builtin", dir: "fixtures/with-ds-app", prompts: "prompts" },
  "rn-app": { kind: "builtin", dir: "fixtures/rn-app", prompts: "prompts-rn" },
  "knowing-saju": { kind: "external", env: "DSMITH_BENCH_REPO_PATH", prompts: "prompts-rn" },
} as const satisfies Record<RepoName, RepoSpec>;

export function isExternalRepo(repo: RepoName): boolean {
  return REPOS[repo].kind === "external";
}

export { MONOREPO_ROOT };
export const CLI_BIN: string = path.join(MONOREPO_ROOT, "packages/cli/dist/bin.js");

export interface Base {
  dir: string;
  snapshot: GuardSnapshot;
  snapshotSha256: string;
  matchers: ReturnType<typeof extractorMatchers>;
  /** JS 테마 참조(`colors.surface`)를 스냅샷 토큰 사용으로 해석한다 — 채점이 audit·guard와 같은 해석을 쓴다 */
  resolveRef: RefResolver;
}

/** 외부 앱 복사에서 뺄 디렉터리 이름(어느 깊이든) */
const EXTERNAL_SKIP_DIRS = new Set(["node_modules", ".git", "ios", "android", ".expo", "dist", "build", ".dsmith"]);
/** 외부 앱 복사에서 뺄 파일 이름 */
const EXTERNAL_SKIP_FILES = new Set(["google-services.json", "GoogleService-Info.plist"]);
const EXTERNAL_SKIP_EXT = /\.(?:p8|p12|keystore|jks|mobileprovision|pem|key)$/i;

/**
 * 외부(비공개) 앱 복사 필터 — 에이전트에 넘기면 안 되는 것(비밀 파일·네이티브 프로젝트·설치물·도구 작업 파일)을 뺀다.
 * node_modules, .git, ios, android, .expo, dist, build, .dsmith 디렉터리, .env*(.envrc 포함), *.p8|*.p12|*.keystore|*.jks|*.mobileprovision|*.pem|*.key, google-services.json, GoogleService-Info.plist.
 * 이름(basename)만 보므로 어느 깊이에서든 걸린다.
 */
export function externalCopyFilter(src: string): boolean {
  const name = path.basename(src);
  if (EXTERNAL_SKIP_DIRS.has(name) || EXTERNAL_SKIP_FILES.has(name)) return false;
  if (name === ".env" || name === ".envrc" || name.startsWith(".env.")) return false;
  return !EXTERNAL_SKIP_EXT.test(name);
}

/**
 * 외부 레포 경로 확인. --repo-path가 환경 변수보다 앞선다. 없으면 안내 Error.
 * 디렉터리여야 하고 package.json이 있어야 하며 모노레포 밖이어야 한다(비공개 코드가 저장소 안에 들어오지 않게). 실제 경로(realpath)를 돌려준다.
 */
export function resolveExternalRepoPath(repo: RepoName, repoPath: string | null, env: NodeJS.ProcessEnv = process.env): string {
  const spec = REPOS[repo];
  if (spec.kind !== "external") throw new Error(`${repo}는 저장소 안의 레포라 --repo-path를 쓰지 않습니다`);
  const given = repoPath ?? (env[spec.env] === undefined || env[spec.env] === "" ? null : (env[spec.env] ?? null));
  if (given === null) throw new Error(`--repo ${repo}는 앱 위치가 필요합니다: --repo-path <디렉터리> 또는 환경 변수 ${spec.env}를 지정하세요(경로는 커밋하지 않습니다)`);
  let real: string;
  try {
    real = fsSync.realpathSync(path.resolve(given));
  } catch {
    throw new Error(`앱 경로를 찾을 수 없습니다(${repoPath !== null ? "--repo-path" : spec.env})`);
  }
  if (!fsSync.statSync(real).isDirectory()) throw new Error(`앱 경로가 디렉터리가 아닙니다(${repoPath !== null ? "--repo-path" : spec.env})`);
  if (!fsSync.existsSync(path.join(real, "package.json"))) throw new Error("앱 경로에 package.json이 없습니다");
  if (isInsideMonorepo(real)) throw new Error("앱 경로가 모노레포 안입니다 — 비공개 앱은 저장소 밖에 둬야 합니다");
  return real;
}

const DS_SECTION = /<!-- dsmith:(?:ds:)?start -->[\s\S]*?<!-- dsmith:(?:ds:)?end -->\n?/g;

/** 정리된 환경으로 `node CLI_BIN <args>`를 cwd에서 실행한다. 종료 코드가 0이 아니면 stderr를 담아 던진다. */
function runCli(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_BIN, ...args], { cwd, env: agentEnv([]), stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d: Buffer) => (out += d.toString("utf-8")));
    child.stderr.on("data", (d: Buffer) => (err += d.toString("utf-8")));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`dsmith ${args.join(" ")} 실패(종료 코드 ${String(code)}): ${err.trim()}${out === "" ? "" : `\n${out.trim().slice(-2000)}`}`));
    });
  });
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.lstat(p);
    return true;
  } catch {
    return false;
  }
}

async function mkTmp(prefix: string): Promise<string> {
  const dir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), prefix)));
  const rel = path.relative(MONOREPO_ROOT, dir);
  if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
    await fs.rm(dir, { recursive: true, force: true });
    throw new Error(`임시 디렉터리가 모노레포 아래입니다(${dir}) — TMPDIR을 모노레포 밖으로 지정하세요`);
  }
  return dir;
}

async function copyDir(from: string, to: string, external: boolean): Promise<void> {
  // 루트 자신(src === from)은 이름이 무엇이든 복사한다
  await fs.cp(from, to, {
    recursive: true,
    filter: (src) => src === from || (external ? externalCopyFilter(src) : path.basename(src) !== ".dsmith"),
  });
}

/** 복사본에 채점 코드(benchmarks/)가 있으면 던진다 — 에이전트에 정답 기준이 노출되면 안 된다. */
async function assertNoHarness(dir: string): Promise<void> {
  if (await exists(path.join(dir, "benchmarks"))) throw new Error(`복사본에 benchmarks/ 디렉터리가 있습니다: ${dir}`);
}

/**
 * mkdtemp(dsmith-bench-base-) ← REPOS[repo] 복사(.dsmith 제외) → `audit` → `init --all` → `ai`(모두 node CLI_BIN, cwd=dir, 정리된 env).
 * `ai`까지 거쳐야 .dsmith/catalog.json이 생겨 스냅샷의 DS module·컴포넌트가 채워진다(없으면 nonDs가 늘 0). 상태 override 없음(결정 1).
 * 스냅샷은 이 베이스에서 한 번 만들어 두 조건 모두에 쓴다(결정 2).
 * 토큰 파일은 init이 쓰든(웹·테마 없는 RN) 쓰지 않든(기존 JS 테마를 그대로 쓰는 RN) 상관없다 — 스냅샷은 detect가 가리키는 토큰 원천을 그대로 읽는다.
 * 외부 레포(`knowing-saju`)는 repoPath(없으면 환경 변수)의 앱을 `externalCopyFilter`로 걸러 복사한다.
 */
export async function prepareBase(repo: RepoName, opts: { repoPath?: string | null; env?: NodeJS.ProcessEnv } = {}): Promise<Base> {
  if (!(await exists(CLI_BIN))) throw new Error(`${CLI_BIN} 이 없습니다 — 먼저 pnpm -r build 를 실행하세요`);
  const spec = REPOS[repo];
  const source = spec.kind === "external" ? resolveExternalRepoPath(repo, opts.repoPath ?? null, opts.env) : path.join(MONOREPO_ROOT, spec.dir);
  const dir = await mkTmp("dsmith-bench-base-");
  try {
    await copyDir(source, dir, spec.kind === "external");
    await assertNoHarness(dir);
    await runCli(dir, ["audit", "--json"]);
    await runCli(dir, ["init", "--all", "--json"]);
    await runCli(dir, ["ai", "--json"]);
    const detect = await readDetect(dir);
    if (detect === null) throw new Error(`detect 결과가 없습니다: ${dir}`);
    const snapshot = await buildGuardSnapshot({ root: dir, detect, version: "bench", existing: null });
    const extractors = extractorsFor(snapshot.extractors);
    for (const e of extractors) await e.prepare?.(dir);
    // 참조 해석기는 audit과 같은 기준으로 읽은 토큰 전부(모드·JS 테마 토큰 포함)에서 만든다 — snapshot.tokens는 치환 후보뿐이다
    const all = await loadReplacementTokens(dir, detect.ds.tokenFiles, {
      framework: detect.framework.name,
      jsThemeFiles: (detect.ds.jsThemes ?? []).map((t) => t.file),
    });
    const resolveRef = buildTokenRefResolver(all.allTokens, { tsPaths: snapshot.moduleContext.tsPaths, moduleContext: moduleContextOf(snapshot) });
    return { dir, snapshot, snapshotSha256: sha256Text(JSON.stringify(snapshot)), matchers: extractorMatchers(extractors, { dot: true }), resolveRef };
  } catch (e) {
    await fs.rm(dir, { recursive: true, force: true });
    throw e;
  }
}

/** AGENTS.md에서 dsmith 마커 블록(`dsmith:ds`·`dsmith`)을 뺀다. 남는 것이 공백뿐이면 파일을 지운다. */
async function stripAgentsSection(dir: string): Promise<void> {
  const file = path.join(dir, "AGENTS.md");
  if (!(await exists(file))) return;
  const rest = (await fs.readFile(file, "utf-8")).replace(DS_SECTION, "");
  if (rest.trim() === "") await fs.rm(file);
  else await fs.writeFile(file, `${rest.replace(/\s+$/, "")}\n`);
}

/** `.claude/skills`를 지우고, 그 뒤 `.claude`가 비었으면 그것도 지운다 */
async function stripSkills(dir: string): Promise<void> {
  await fs.rm(path.join(dir, ".claude/skills"), { recursive: true, force: true });
  const claude = path.join(dir, ".claude");
  if ((await fs.readdir(claude).catch(() => ["."])).length === 0) await fs.rmdir(claude);
}

/**
 * `dsmith` 조건이 부르는 install 인자. `install`의 기본은 AGENTS.md DS 섹션뿐이라(`--mcp`·`--skills`는 선택),
 * "dsmith 조건 = 전부"라는 뜻을 유지하려고 `--mcp --skills`를 명시한다. (`--all`은 AI 도구 전부를 뜻해 쓰지 않는다.)
 * agents-only·mcp-only·agents-mcp는 이 결과에서 빼는 방식으로 만든다.
 */
export function dsmithInstallArgs(installTool: string): string[] {
  return ["install", "--tool", installTool, "--mcp", "--skills", "--mcp-command", `node ${CLI_BIN}`, "--json"];
}

/** 조건별 실제 install 명령. agents-only = 기본 install, agents-mcp·mcp-only = --mcp, dsmith = --mcp --skills. */
export function conditionInstallArgs(condition: Exclude<Condition, "baseline">, installTool: string): string[] {
  if (condition === "dsmith") return dsmithInstallArgs(installTool);
  if (condition === "agents-only") return ["install", "--tool", installTool, "--json"];
  return ["install", "--tool", installTool, "--mcp", "--mcp-command", `node ${CLI_BIN}`, "--json"];
}

/**
 * base.dir을 새 mkdtemp로 복사한 조건 템플릿. 2×2: AGENTS.md DS 섹션 × MCP 서버(.mcp.json).
 * baseline: `.dsmith/`·`.mcp.json`·AGENTS.md의 dsmith 섹션(그것뿐이면 파일째) 삭제 → dsmith 흔적 없음.
 * 나머지는 사용자가 칠 install 명령 그대로(`conditionInstallArgs`, ai는 베이스에서 이미 실행됨) — 섹션 문구가 설치된 표면에 맞게 렌더링된다.
 * agents-only: `install`(기본) → AGENTS.md 섹션만(MCP·슬래시 명령 언급 없음).
 * agents-mcp: `install --mcp` → 섹션(MCP 도구 언급) + `.mcp.json`.
 * mcp-only: `install --mcp` 뒤 AGENTS.md dsmith 섹션 삭제 → `.mcp.json`만.
 * dsmith: `install --mcp --skills` → 전부.
 */
export async function prepareCondition(base: Base, condition: Condition, installTool: string): Promise<string> {
  const dir = await mkTmp(`dsmith-bench-${condition}-`);
  try {
    await fs.cp(base.dir, dir, { recursive: true });
    await assertNoHarness(dir);
    if (condition === "baseline") {
      await fs.rm(path.join(dir, ".dsmith"), { recursive: true, force: true });
      await fs.rm(path.join(dir, ".mcp.json"), { force: true });
      await stripAgentsSection(dir);
    } else {
      // 사용자가 실제로 칠 install 명령 그대로 만든다 — AGENTS.md 섹션 문구가 설치된 표면(MCP·스킬)에 맞게 렌더링된다.
      await runCli(dir, conditionInstallArgs(condition, installTool));
      const agents = await fs.readFile(path.join(dir, "AGENTS.md"), "utf-8").catch(() => "");
      if (!agents.includes("<!-- dsmith:ds:start -->")) throw new Error(`dsmith 조건 템플릿의 AGENTS.md에 DS 섹션이 없습니다: ${dir}`);
      if (condition === "mcp-only") await stripAgentsSection(dir);
    }
    return dir;
  } catch (e) {
    await fs.rm(dir, { recursive: true, force: true });
    throw e;
  }
}

function git(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "git",
      ["-c", "user.name=dsmith-bench", "-c", "user.email=bench@dsmith.invalid", "-c", "commit.gpgsign=false", ...args],
      { cwd, env: { ...agentEnv([]), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" }, stdio: ["ignore", "ignore", "pipe"] },
    );
    let err = "";
    child.stderr.on("data", (d: Buffer) => (err += d.toString("utf-8")));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`git ${args.join(" ")} 실패(${String(code)}): ${err.trim()}`))));
  });
}

/** 템플릿을 새 mkdtemp로 복사 → git init -b main, add -A, commit "bench base". 반환: 복사본 경로 */
export async function makeRunCopy(template: string): Promise<string> {
  const dir = await mkTmp("dsmith-bench-run-");
  try {
    await fs.cp(template, dir, { recursive: true });
    await assertNoHarness(dir);
    await git(dir, ["init", "-q", "-b", "main"]);
    await git(dir, ["add", "-A"]);
    await git(dir, ["commit", "-q", "-m", "bench base"]);
    return dir;
  } catch (e) {
    await fs.rm(dir, { recursive: true, force: true });
    throw e;
  }
}

/** claude → "claude-code", codex → "codex", 그 밖 → "agents-md" (명령 첫 단어 기준) */
export function defaultInstallTool(agentCmd: string): string {
  const first = path.basename(agentCmd.trim().split(/\s+/)[0] ?? "");
  if (first === "claude") return "claude-code";
  if (first === "codex") return "codex";
  return "agents-md";
}

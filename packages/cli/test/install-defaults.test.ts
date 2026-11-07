import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runAudit } from "../src/commands/audit.js";
import { runInitCommand } from "../src/commands/init.js";
import { formatInstallSummary, runInstall, skippedSurfacesLine, type InstallOptions } from "../src/commands/install.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.resolve(here, "../dist/bin.js");
const VERSION = "0.2.0";
const DS_START = "<!-- dsmith:ds:start -->";
const SKIP_LINE =
  "MCP·슬래시 명령은 기본으로 설치하지 않음(벤치마크: AGENTS.md만 있을 때 토큰 사용률이 가장 높았음) — 필요하면 --mcp·--skills";

let tmp: string;
let repo: string;
let home: string;
beforeEach(async () => {
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-install-defaults-")));
  repo = path.join(tmp, "legacy-demo");
  home = path.join(tmp, "home");
  fs.mkdirSync(home);
  fs.cpSync(path.resolve(here, "../../../examples/legacy-demo"), repo, {
    recursive: true,
    filter: (src) => !src.split(path.sep).includes(".dsmith"),
  });
  await runAudit(repo);
  await runInitCommand({ root: repo, all: true });
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

const install = (opts: Partial<InstallOptions> = {}) =>
  runInstall({ root: repo, home, version: VERSION, tools: ["claude-code"], ...opts });

function listFiles(dir: string, prefix = ""): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(path.join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`],
  );
}
const surfaceFiles = (): string[] =>
  listFiles(repo).filter((f) => f.startsWith(".claude/") || f === ".mcp.json" || f.startsWith(".cursor/") || f.startsWith(".gemini/") || f.startsWith(".agents/") || f.startsWith(".codex/"));

describe("install 기본값: AGENTS.md DS 섹션만", () => {
  it("플래그가 없으면 DS 섹션을 쓰고 .mcp.json·.claude/skills는 쓰지 않는다", async () => {
    const r = await install();
    expect(r.surfaces).toEqual({ mcp: false, skills: false });
    expect(r.outcomes).toEqual([]);
    expect(r.ds).toMatchObject({ status: "ok", file: "AGENTS.md", outcome: "created" });
    expect(fs.readFileSync(path.join(repo, "AGENTS.md"), "utf-8")).toContain(DS_START);
    expect(surfaceFiles()).toEqual([]);
    expect(fs.existsSync(path.join(repo, ".dsmith", "install.json"))).toBe(false);
  });

  it("5개 도구를 전부 골라도(--all) 기본에서는 MCP·스킬·명령 파일이 없다", async () => {
    await install({ all: true });
    expect(surfaceFiles()).toEqual([]);
    expect(fs.readFileSync(path.join(repo, "AGENTS.md"), "utf-8")).not.toContain("<!-- dsmith:start -->");
  });

  it("요약에 설치한 것과, 건너뛴 표면 한 줄이 나온다", async () => {
    const text = formatInstallSummary(await install());
    expect(text).toContain("설치: AGENTS.md DS 섹션");
    expect(text).toContain("AGENTS.md DS 섹션: 생성 (AGENTS.md, 컴포넌트");
    expect(text).toContain(SKIP_LINE);
    expect(text.split("\n").at(-1)).toBe("다음: AI 도구를 다시 열면 AGENTS.md의 DS 규칙을 읽습니다");
  });

  it("건너뛴 표면 한 줄은 켠 것을 빼고 남은 것만 말한다", async () => {
    const mcpOnly = await install({ mcp: true, dryRun: true, mcpCommand: "node /x/bin.js" });
    expect(skippedSurfacesLine(mcpOnly)).toBe(
      "슬래시 명령은 기본으로 설치하지 않음(벤치마크: AGENTS.md만 있을 때 토큰 사용률이 가장 높았음) — 필요하면 --skills",
    );
    const skillsOnly = await install({ skills: true, dryRun: true });
    expect(skippedSurfacesLine(skillsOnly)).toBe(
      "MCP는 기본으로 설치하지 않음(벤치마크: AGENTS.md만 있을 때 토큰 사용률이 가장 높았음) — 필요하면 --mcp",
    );
    expect(skippedSurfacesLine(await install({ mcp: true, skills: true, dryRun: true }))).toBeNull();
  });

  it("두 번째 실행은 아무것도 바꾸지 않는다", async () => {
    await install();
    const before = fs.readFileSync(path.join(repo, "AGENTS.md"), "utf-8");
    const r = await install();
    expect(r.ds).toMatchObject({ status: "ok", outcome: "unchanged" });
    expect(fs.readFileSync(path.join(repo, "AGENTS.md"), "utf-8")).toBe(before);
  });

  it("분석 결과가 없으면 DS 섹션을 못 쓰고 note로 알린다(설치는 실패하지 않는다)", async () => {
    fs.rmSync(path.join(repo, ".dsmith"), { recursive: true, force: true });
    const r = await install();
    expect(r.ds.status).toBe("skipped");
    expect(r.notes.join("\n")).toContain("AGENTS.md DS 섹션을 만들지 못함");
    expect(fs.existsSync(path.join(repo, "AGENTS.md"))).toBe(false);
  });

  it("--dry-run은 아무것도 쓰지 않는다", async () => {
    const r = await install({ dryRun: true });
    expect(r.ds).toMatchObject({ status: "ok", outcome: "created", catalogFile: null });
    expect(fs.existsSync(path.join(repo, "AGENTS.md"))).toBe(false);
  });

  it("--global은 레포 AGENTS.md를 쓰지 않는다", async () => {
    const r = await install({ global: true });
    expect(r.ds.status).toBe("skipped");
    expect(fs.existsSync(path.join(repo, "AGENTS.md"))).toBe(false);
  });

  it("0.0.0 개발 빌드도 MCP·스킬을 안 쓰면 --mcp-command 없이 설치된다", async () => {
    await expect(install({ version: "0.0.0" })).resolves.toMatchObject({ ds: { status: "ok" } });
    await expect(install({ version: "0.0.0", skills: true })).rejects.toThrow("--mcp-command");
  });
});

describe("install 선택 표면: --mcp · --skills · --mcp-command", () => {
  it("--mcp는 .mcp.json만 쓴다", async () => {
    const r = await install({ mcp: true });
    expect(r.surfaces).toEqual({ mcp: true, skills: false });
    expect(surfaceFiles()).toEqual([".mcp.json"]);
  });

  it("--skills는 .claude/skills만 쓴다", async () => {
    const r = await install({ skills: true });
    expect(r.surfaces).toEqual({ mcp: false, skills: true });
    expect(surfaceFiles().every((f) => f.startsWith(".claude/skills/"))).toBe(true);
    expect(surfaceFiles()).toHaveLength(9);
  });

  it("--mcp-command는 --mcp를 함께 켠다", async () => {
    const r = await install({ mcpCommand: "node /x/bin.js" });
    expect(r.surfaces).toEqual({ mcp: true, skills: false });
    expect(JSON.parse(fs.readFileSync(path.join(repo, ".mcp.json"), "utf-8")).mcpServers.dsmith.command).toBe("node");
  });

  it("--mcp --skills는 예전 기본 설치와 같은 파일을 쓰고 건너뛴 표면 줄이 없다", async () => {
    const r = await install({ mcp: true, skills: true });
    expect(surfaceFiles()).toHaveLength(10);
    expect(formatInstallSummary(r)).not.toContain("기본으로 설치하지 않음");
  });

  it("codex/agents-md: 기본은 AGENTS.md에 명령 표 블록을 더하지 않고, --skills면 더한다", async () => {
    await install({ tools: ["codex"] });
    expect(fs.readFileSync(path.join(repo, "AGENTS.md"), "utf-8")).not.toContain("<!-- dsmith:start -->");
    expect(surfaceFiles()).toEqual([]);
    await install({ tools: ["codex"], skills: true });
    expect(fs.readFileSync(path.join(repo, "AGENTS.md"), "utf-8")).toContain("<!-- dsmith:start -->");
    expect(surfaceFiles().some((f) => f.startsWith(".agents/skills/"))).toBe(true);
    expect(surfaceFiles()).not.toContain(".codex/config.toml");
  });
});

describe("재실행은 이전에 설치한 것을 지우지 않는다", () => {
  it("--mcp --skills로 설치한 뒤 플래그 없이 다시 실행해도 .mcp.json·스킬·매니페스트가 그대로다", async () => {
    await install({ mcp: true, skills: true });
    const before = surfaceFiles().sort();
    const manifest = fs.readFileSync(path.join(repo, ".dsmith", "install.json"), "utf-8");
    const r = await install();
    expect(r.outcomes).toEqual([]);
    expect(surfaceFiles().sort()).toEqual(before);
    expect(fs.readFileSync(path.join(repo, ".dsmith", "install.json"), "utf-8")).toBe(manifest);
  });
});

describe("dsmith install (CLI) 기본값", () => {
  const run = (args: string[]): string =>
    execFileSync(process.execPath, [bin, "install", "--root", repo, ...args], {
      encoding: "utf-8",
      env: { ...process.env, HOME: home, USERPROFILE: home },
    });

  it("--json은 surfaces·ds를 담고 --mcp-command 없이도 동작한다", () => {
    const out = JSON.parse(run(["--json", "--tool", "claude-code"]));
    expect(out.surfaces).toEqual({ mcp: false, skills: false });
    expect(out.ds.status).toBe("ok");
    expect(out.outcomes).toEqual([]);
    expect(surfaceFiles()).toEqual([]);
  });

  it("--mcp --skills --mcp-command는 모든 표면을 쓴다", () => {
    const text = run(["--tool", "claude-code", "--mcp", "--skills", "--mcp-command", "node /x/bin.js"]);
    expect(text).toContain("설치: AGENTS.md DS 섹션 · MCP 서버 · 슬래시 명령");
    expect(text).not.toContain("기본으로 설치하지 않음");
    expect(surfaceFiles()).toHaveLength(10);
  });

  it("도움말에 --mcp·--skills가 보인다", () => {
    const help = run(["--help"]);
    expect(help).toContain("--mcp");
    expect(help).toContain("--skills");
  });
});

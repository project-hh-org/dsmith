import fs from "node:fs";
import { extractFileStyles } from "@dsmith-dev/core";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLI_BIN, MONOREPO_ROOT, defaultInstallTool, dsmithInstallArgs, makeRunCopy, prepareBase, prepareCondition, type Base } from "../src/base.js";
import { cleanupTmps, git, tmpDir } from "./helpers.js";

afterAll(cleanupTmps);

function listFiles(root: string, rel = ""): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
    const r = rel === "" ? e.name : `${rel}/${e.name}`;
    if (e.isDirectory()) out.push(...listFiles(root, r));
    else out.push(r);
  }
  return out.sort();
}

describe("prepareBase / prepareCondition / makeRunCopy", () => {
  let base: Base;
  let baseline: string;
  let dsmith: string;

  beforeAll(async () => {
    base = await prepareBase("legacy-demo");
    baseline = await prepareCondition(base, "baseline", "claude-code");
    dsmith = await prepareCondition(base, "dsmith", "claude-code");
  }, 120_000);

  afterAll(() => {
    for (const d of [base?.dir, baseline, dsmith]) if (d !== undefined) fs.rmSync(d, { recursive: true, force: true });
  });

  it("베이스: 모노레포 밖, benchmarks/ 없음, audit → init --all → ai 결과(.dsmith/catalog.json)와 토큰 14·DS module 4·컴포넌트 6", () => {
    expect(path.relative(MONOREPO_ROOT, base.dir).startsWith("..")).toBe(true);
    expect(fs.existsSync(path.join(base.dir, "benchmarks"))).toBe(false);
    expect(fs.existsSync(path.join(base.dir, ".dsmith/catalog.json"))).toBe(true);
    expect(fs.existsSync(path.join(base.dir, "design-system/tokens.json"))).toBe(true);
    expect(base.snapshot.tokens).toHaveLength(14);
    expect(base.snapshot.ds.modules).toHaveLength(4);
    expect(base.snapshot.ds.components).toHaveLength(6);
    expect(base.snapshotSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("채점 resolver는 치환 후보가 아닌 JS 테마 토큰(웹 CSS 토큰 레포의 theme.muted)도 토큰 사용으로 해석한다 — audit과 같은 기준", () => {
    expect(base.snapshot.tokens.some((t) => t.js !== undefined)).toBe(false);
    const code = fs.readFileSync(path.join(base.dir, "src/components/Topbar.tsx"), "utf-8");
    const styles = extractFileStyles({ root: base.dir, file: "src/components/Topbar.tsx", code }, base.matchers, { resolveRef: base.resolveRef }).styles;
    expect(styles.find((s) => s.raw.includes("theme.muted"))?.source).toBe("token");
  });

  it("baseline: .dsmith·.mcp.json·AGENTS.md(DS 섹션뿐이라 파일째)·.claude 없음, 토큰 파일은 있음", () => {
    expect(fs.existsSync(path.join(baseline, ".dsmith"))).toBe(false);
    expect(fs.existsSync(path.join(baseline, ".mcp.json"))).toBe(false);
    expect(fs.existsSync(path.join(baseline, "AGENTS.md"))).toBe(false);
    expect(fs.existsSync(path.join(baseline, ".claude"))).toBe(false);
    expect(fs.existsSync(path.join(baseline, "benchmarks"))).toBe(false);
    expect(fs.existsSync(path.join(baseline, "design-system/tokens.css"))).toBe(true);
  });

  it("dsmith: AGENTS.md DS 섹션, .mcp.json(node + 로컬 빌드 CLI), 스킬, .dsmith 있음 / benchmarks/ 없음", () => {
    expect(fs.readFileSync(path.join(dsmith, "AGENTS.md"), "utf-8")).toContain("<!-- dsmith:ds:start -->");
    const mcp = JSON.parse(fs.readFileSync(path.join(dsmith, ".mcp.json"), "utf-8")) as { mcpServers: { dsmith: { command: string; args: string[] } } };
    expect(mcp.mcpServers.dsmith.command).toBe("node");
    expect(mcp.mcpServers.dsmith.args[0]).toBe(CLI_BIN);
    expect(fs.existsSync(path.join(dsmith, ".claude/skills/ds/SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(dsmith, ".dsmith/catalog.json"))).toBe(true);
    expect(fs.existsSync(path.join(dsmith, "benchmarks"))).toBe(false);
    expect(path.relative(MONOREPO_ROOT, dsmith).startsWith("..")).toBe(true);
  });

  it("공정성: 두 조건의 차이는 .claude·.dsmith·.mcp.json·AGENTS.md 뿐이다", () => {
    const a = new Set(listFiles(baseline));
    const b = new Set(listFiles(dsmith));
    const onlyIn = (x: Set<string>, y: Set<string>): string[] => [...x].filter((f) => !y.has(f));
    expect(onlyIn(a, b)).toEqual([]);
    const extra = onlyIn(b, a).filter((f) => !f.startsWith(".claude/") && !f.startsWith(".dsmith/") && f !== ".mcp.json" && f !== "AGENTS.md");
    expect(extra).toEqual([]);
    // 공통 소스는 바이트 같다
    for (const f of a) expect(fs.readFileSync(path.join(baseline, f))).toEqual(fs.readFileSync(path.join(dsmith, f)));
  });

  it("2×2: 네 조건의 파일 집합 — AGENTS.md 섹션·.mcp.json·.claude/skills·.dsmith 유무가 표와 같고, 그 밖의 파일은 네 복사본이 바이트까지 같다", async () => {
    const agentsOnly = await prepareCondition(base, "agents-only", "claude-code");
    const mcpOnly = await prepareCondition(base, "mcp-only", "claude-code");
    try {
      const dirs = { baseline, "agents-only": agentsOnly, "mcp-only": mcpOnly, dsmith };
      const has = (d: string, rel: string): boolean => fs.existsSync(path.join(d, rel));
      const section = (d: string): boolean => has(d, "AGENTS.md") && fs.readFileSync(path.join(d, "AGENTS.md"), "utf-8").includes("<!-- dsmith:ds:start -->");
      // 표: [AGENTS.md DS 섹션, .mcp.json, .claude/skills, .dsmith]
      const matrix = {
        baseline: [false, false, false, false],
        "agents-only": [true, false, false, true],
        "mcp-only": [false, true, false, true],
        dsmith: [true, true, true, true],
      } as const;
      for (const [c, d] of Object.entries(dirs)) {
        expect([section(d), has(d, ".mcp.json"), has(d, ".claude/skills"), has(d, ".dsmith/catalog.json")], c).toEqual([...matrix[c as keyof typeof matrix]]);
        expect(has(d, "benchmarks"), c).toBe(false);
        expect(has(d, "design-system/tokens.css"), c).toBe(true);
        // 섹션이 없는 조건에는 AGENTS.md 파일 자체가 없다(legacy-demo에는 원래 AGENTS.md가 없다)
        if (!matrix[c as keyof typeof matrix][0]) expect(has(d, "AGENTS.md"), c).toBe(false);
        // 스킬을 지운 뒤 빈 .claude 디렉터리도 남기지 않는다
        if (!matrix[c as keyof typeof matrix][2]) expect(has(d, ".claude"), c).toBe(false);
      }
      // .mcp.json·.dsmith는 있는 조건끼리 같은 내용이다. AGENTS.md 섹션은 실제 install처럼 설치된 표면에 맞게 렌더링되므로
      // agents-only(기본 install)에는 MCP·슬래시 명령 언급이 없고, dsmith(--mcp --skills)에는 있다.
      const same = (rel: string, a: string, b: string): void => expect(fs.readFileSync(path.join(a, rel)), rel).toEqual(fs.readFileSync(path.join(b, rel)));
      same(".mcp.json", mcpOnly, dsmith);
      const agentsText = (d: string): string => fs.readFileSync(path.join(d, "AGENTS.md"), "utf-8");
      expect(agentsText(agentsOnly)).not.toMatch(/resolve_token|search_component|lint_snippet|\/ds-check/);
      expect(agentsText(dsmith)).toMatch(/resolve_token/);
      expect(agentsText(dsmith)).toMatch(/\/ds-check/);
      // ai.json은 섹션을 렌더링한 표면 정보를 담으므로 조건마다 다르다
      for (const f of listFiles(agentsOnly).filter((x) => x.startsWith(".dsmith/") && !x.startsWith(".dsmith/reports/") && x !== ".dsmith/ai.json")) same(f, agentsOnly, dsmith);
      expect(fs.readFileSync(path.join(mcpOnly, ".mcp.json"), "utf-8")).toContain(CLI_BIN);

      // 네 복사본의 차이는 전환 경로(AGENTS.md·.mcp.json·.claude/·.dsmith/)뿐이고, 나머지 파일 집합과 내용은 같다
      const SWITCH = (f: string): boolean => f === "AGENTS.md" || f === ".mcp.json" || f.startsWith(".claude/") || f.startsWith(".dsmith/");
      const common = listFiles(baseline).filter((f) => !SWITCH(f));
      expect(common.length).toBeGreaterThan(10);
      for (const d of Object.values(dirs)) {
        expect(listFiles(d).filter((f) => !SWITCH(f))).toEqual(common);
        for (const f of common) expect(fs.readFileSync(path.join(d, f)), f).toEqual(fs.readFileSync(path.join(baseline, f)));
      }
    } finally {
      for (const d of [agentsOnly, mcpOnly]) fs.rmSync(d, { recursive: true, force: true });
    }
  }, 120_000);

  it("mcp-only는 AGENTS.md의 다른 내용은 남기고 dsmith 섹션만 뺀다(.mcp.json·.dsmith는 유지, 스킬은 삭제)", async () => {
    const tool = "claude-code";
    const probe = { dir: tmpDir("dsmith-bench-mcponly-") } as Base;
    fs.cpSync(base.dir, probe.dir, { recursive: true });
    // DS 섹션은 베이스의 `ai`가 쓴다 — 사용자 내용을 그 앞에 둔다
    const section = fs.readFileSync(path.join(base.dir, "AGENTS.md"), "utf-8");
    fs.writeFileSync(path.join(probe.dir, "AGENTS.md"), `# 내 규칙\n\n- 커밋 전에 린트\n\n${section}`);
    const out = await prepareCondition(probe, "mcp-only", tool);
    try {
      expect(fs.readFileSync(path.join(out, "AGENTS.md"), "utf-8")).toBe("# 내 규칙\n\n- 커밋 전에 린트\n");
      expect(fs.existsSync(path.join(out, ".mcp.json"))).toBe(true);
      expect(fs.existsSync(path.join(out, ".dsmith/catalog.json"))).toBe(true);
      expect(fs.existsSync(path.join(out, ".claude"))).toBe(false);
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  }, 120_000);

  it("baseline은 AGENTS.md의 다른 내용은 남기고 dsmith 섹션만 뺀다", async () => {
    const dir = tmpDir("dsmith-bench-agentsmd-");
    fs.writeFileSync(path.join(dir, "AGENTS.md"), "# 내 규칙\n\n- 커밋 전에 린트\n\n<!-- dsmith:ds:start -->\nDS 섹션\n<!-- dsmith:ds:end -->\n");
    fs.mkdirSync(path.join(dir, ".dsmith"));
    fs.writeFileSync(path.join(dir, ".mcp.json"), "{}");
    const out = await prepareCondition({ dir } as Base, "baseline", "claude-code");
    try {
      expect(fs.readFileSync(path.join(out, "AGENTS.md"), "utf-8")).toBe("# 내 규칙\n\n- 커밋 전에 린트\n");
      expect(fs.existsSync(path.join(out, ".dsmith"))).toBe(false);
      expect(fs.existsSync(path.join(out, ".mcp.json"))).toBe(false);
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  it("makeRunCopy: git 레포 + 기준 커밋 'bench base', 작업 트리 깨끗, 템플릿은 그대로", async () => {
    const copy = await makeRunCopy(dsmith);
    try {
      expect(copy).not.toBe(dsmith);
      expect(path.relative(MONOREPO_ROOT, copy).startsWith("..")).toBe(true);
      expect(git(copy, "status", "--porcelain").trim()).toBe("");
      expect(git(copy, "log", "-1", "--format=%s").trim()).toBe("bench base");
      expect(git(copy, "branch", "--show-current").trim()).toBe("main");
      expect(fs.existsSync(path.join(copy, ".mcp.json"))).toBe(true);
      expect(fs.existsSync(path.join(dsmith, ".git"))).toBe(false);
    } finally {
      fs.rmSync(copy, { recursive: true, force: true });
    }
  });

  it("TMPDIR이 모노레포 아래면 Error", async () => {
    const prev = process.env.TMPDIR;
    process.env.TMPDIR = path.join(MONOREPO_ROOT, "benchmarks/dist");
    try {
      await expect(makeRunCopy(baseline)).rejects.toThrow(/모노레포 아래/);
    } finally {
      if (prev === undefined) delete process.env.TMPDIR;
      else process.env.TMPDIR = prev;
    }
  });
});

describe("dsmithInstallArgs", () => {
  it("dsmith 조건은 install 기본값(AGENTS.md만)에 기대지 않고 --mcp --skills를 명시한다", () => {
    const args = dsmithInstallArgs("claude-code");
    expect(args).toEqual(["install", "--tool", "claude-code", "--mcp", "--skills", "--mcp-command", `node ${CLI_BIN}`, "--json"]);
    // --all은 AI 도구 전부를 뜻하므로 단일 도구 조건에 쓰지 않는다
    expect(args).not.toContain("--all");
  });
});

describe("agents-mcp 조건", () => {
  it("AGENTS.md 섹션 + .mcp.json + .dsmith, 스킬은 없다(.claude도 남기지 않는다)", async () => {
    const base = await prepareBase("legacy-demo");
    const dir = await prepareCondition(base, "agents-mcp", "claude-code");
    try {
      const has = (rel: string): boolean => fs.existsSync(path.join(dir, rel));
      expect(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf-8")).toContain("<!-- dsmith:ds:start -->");
      expect(has(".mcp.json")).toBe(true);
      expect(has(".dsmith/catalog.json")).toBe(true);
      expect(has(".claude")).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(base.dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe("defaultInstallTool", () => {
  it("에이전트 명령 첫 단어로 정한다", () => {
    expect(defaultInstallTool("claude -p --model sonnet")).toBe("claude-code");
    expect(defaultInstallTool("/opt/node22/bin/claude -p")).toBe("claude-code");
    expect(defaultInstallTool("codex exec")).toBe("codex");
    expect(defaultInstallTool("node fake-agent.mjs")).toBe("agents-md");
  });
});

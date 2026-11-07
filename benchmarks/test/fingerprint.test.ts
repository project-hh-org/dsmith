import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prepareBase, prepareCondition, type Base } from "../src/base.js";
import { fingerprintCondition, normalizeMcpConfig } from "../src/fingerprint.js";
import { mergeResults } from "../src/merge.js";
import type { BenchResult, Condition, SetupFingerprint } from "../src/model.js";
import { cleanupTmps } from "./helpers.js";

afterAll(cleanupTmps);

describe("normalizeMcpConfig", () => {
  it("절대 경로를 이름만 남겨 바꾸므로 빌드 위치가 달라도 같다", () => {
    const a = JSON.stringify({ mcpServers: { dsmith: { command: "node", args: ["/work/a/packages/cli/dist/bin.js", "mcp"] } } });
    const b = JSON.stringify({ mcpServers: { dsmith: { command: "node", args: ["/tmp/other/wt/packages/cli/dist/bin.js", "mcp"] } } });
    expect(normalizeMcpConfig(a)).toBe(normalizeMcpConfig(b));
    expect(normalizeMcpConfig(a)).not.toContain("/work/a");
    expect(normalizeMcpConfig(a)).toContain("mcp");
  });
});

describe("fingerprintCondition (실제 조건 복사본)", () => {
  let base: Base;
  const dirs: Partial<Record<Condition, string>> = {};
  const fps: Partial<Record<Condition, SetupFingerprint>> = {};
  const f = (c: Condition): SetupFingerprint => fps[c] as SetupFingerprint;

  beforeAll(async () => {
    base = await prepareBase("legacy-demo");
    for (const c of ["baseline", "agents-only", "mcp-only", "agents-mcp", "dsmith"] as const) {
      dirs[c] = await prepareCondition(base, c, "claude-code");
      fps[c] = await fingerprintCondition(dirs[c] ?? "");
    }
  }, 240_000);

  afterAll(() => {
    for (const d of [base?.dir, ...Object.values(dirs)]) if (d !== undefined) fs.rmSync(d, { recursive: true, force: true });
  });

  it("조건이 가진 표면에만 값이 있다", () => {
    expect([f("baseline").agentsSection, f("baseline").mcpConfig, f("baseline").skills, f("baseline").mcpTools]).toEqual([null, null, null, null]);
    expect(f("agents-only").agentsSection).toMatch(/^[0-9a-f]{64}$/);
    expect([f("agents-only").mcpConfig, f("agents-only").mcpTools, f("agents-only").skills]).toEqual([null, null, null]);
    expect(f("mcp-only").agentsSection).toBeNull();
    expect(f("mcp-only").mcpTools).toMatch(/^[0-9a-f]{64}$/);
    expect(f("dsmith").skills).toMatch(/^[0-9a-f]{64}$/);
    expect(f("agents-mcp").skills).toBeNull();
  });

  it("MCP 도구 설명·설정은 조건 사이에서 같고, AGENTS.md 섹션은 설치된 표면에 따라 다르다", () => {
    // 섹션은 실제 install처럼 렌더링된다: 기본(agents-only)·--mcp(agents-mcp)·--mcp --skills(dsmith)가 서로 다른 문구
    expect(f("agents-only").agentsSection).not.toBe(f("dsmith").agentsSection);
    expect(f("agents-mcp").agentsSection).not.toBe(f("dsmith").agentsSection);
    expect(f("agents-mcp").mcpTools).toBe(f("dsmith").mcpTools);
    expect(f("mcp-only").mcpTools).toBe(f("dsmith").mcpTools);
    expect(f("mcp-only").mcpConfig).toBe(f("dsmith").mcpConfig);
  });

  it("AGENTS.md 섹션 문구가 바뀌면 지문이 달라지고, 그 결과끼리는 병합이 거부된다", async () => {
    const dir = dirs["agents-only"] ?? "";
    const file = path.join(dir, "AGENTS.md");
    const original = fs.readFileSync(file, "utf-8");
    try {
      fs.writeFileSync(file, original.replace("<!-- dsmith:ds:start -->", "<!-- dsmith:ds:start -->\n(바뀐 문구)"));
      const changed = await fingerprintCondition(dir);
      expect(changed.agentsSection).not.toBe(f("agents-only").agentsSection);
      const mk = (c: Condition, fp: SetupFingerprint, commit: string | null): BenchResult =>
        ({
          version: 1, date: "2026-11-08", startedAt: null, repo: "legacy-demo", mode: "agent",
          agent: { command: "x", version: null, installTool: "claude-code", models: [] },
          dsmith: { version: "0", commit }, base: { tokens: 1, dsComponents: 1, snapshotSha256: "s" },
          prompts: [], conditions: [c], repeat: 1, timeoutSec: 1, status: "complete", abortReason: null,
          runs: [], aggregate: {}, setupFingerprint: { [c]: fp },
        }) as BenchResult;
      // 섹션 문구가 바뀐 빌드는 커밋이 다르다 → 다른 표면끼리라도 병합이 거부된다
      expect(() => mergeResults([{ file: "a.json", result: mk("agents-only", changed, "aaaa") }, { file: "b.json", result: mk("dsmith", f("dsmith"), "bbbb") }])).toThrow(/dsmith 커밋/);
      // 같은 빌드(같은 커밋)의 다른 표면끼리는 합친다
      expect(() => mergeResults([{ file: "a.json", result: mk("agents-only", f("agents-only"), "aaaa") }, { file: "b.json", result: mk("dsmith", f("dsmith"), "aaaa") }])).not.toThrow();
    } finally {
      fs.writeFileSync(file, original);
    }
  });
});

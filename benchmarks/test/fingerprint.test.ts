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

  it("조건 사이에서 같은 파일의 지문은 같다 (AGENTS.md 섹션·MCP 도구 설명)", () => {
    expect(f("agents-only").agentsSection).toBe(f("dsmith").agentsSection);
    expect(f("agents-mcp").agentsSection).toBe(f("dsmith").agentsSection);
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
      const mk = (c: Condition, fp: SetupFingerprint): BenchResult =>
        ({
          version: 1, date: "2026-11-08", startedAt: null, repo: "legacy-demo", mode: "agent",
          agent: { command: "x", version: null, installTool: "claude-code", models: [] },
          dsmith: { version: "0", commit: null }, base: { tokens: 1, dsComponents: 1, snapshotSha256: "s" },
          prompts: [], conditions: [c], repeat: 1, timeoutSec: 1, status: "complete", abortReason: null,
          runs: [], aggregate: {}, setupFingerprint: { [c]: fp },
        }) as BenchResult;
      expect(() => mergeResults([{ file: "a.json", result: mk("agents-only", changed) }, { file: "b.json", result: mk("dsmith", f("dsmith")) }])).toThrow(/AGENTS\.md 섹션/);
    } finally {
      fs.writeFileSync(file, original);
    }
  });
});

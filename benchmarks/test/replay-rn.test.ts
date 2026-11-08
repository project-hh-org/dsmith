import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MONOREPO_ROOT } from "../src/base.js";
import { parseBenchArgs, runBench } from "../src/run.js";

const REPLAY = path.join(MONOREPO_ROOT, "benchmarks/replay/rn-app");
const PROMPTS = ["04-summary-card", "06-status-badge", "10-settings-screen"];

const args = () => parseBenchArgs(["--repo", "rn-app", "--replay", REPLAY, "--prompts", PROMPTS.join(","), "--date", "2026-11-08"]);

describe("rn-app replay (공개 합성 산출물, 네트워크·에이전트 없음)", () => {
  it("두 번 실행해도 JSON이 같고, JS 테마 참조가 dsmith 점수의 token·knownToken으로 센다", async () => {
    const r1 = await runBench(args());
    const r2 = await runBench(args());
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));

    expect(r1).toMatchObject({ repo: "rn-app", mode: "replay", status: "complete", replaySource: "synthetic", conditions: ["baseline", "dsmith"] });
    expect(r1.prompts.map((p) => p.id)).toEqual(PROMPTS);
    expect(r1.runs).toHaveLength(6);
    expect(r1.runs.every((r) => r.status === "replay" && r.score.expectedFile)).toBe(true);
    // 베이스의 토큰 수는 init이 토큰 파일을 쓰는지에 따라 달라지므로 고정하지 않는다 — JS 테마 토큰이 있다는 것만
    expect(r1.base.tokens).toBeGreaterThan(0);

    const base = r1.aggregate.baseline!;
    const ds = r1.aggregate.dsmith!;
    expect(base).toMatchObject({ token: 0, knownToken: 0, compliance: 0, parseFailed: 0, missingExpected: 0 });
    expect(base.hardcoded).toBeGreaterThan(30);
    expect(ds.token).toBeGreaterThan(25);
    expect(ds.knownToken).toBe(ds.token); // JS 참조는 resolver가 스냅샷 토큰으로 풀었을 때만 token이다
    expect(ds.compliance!).toBeGreaterThan(0.85);
    expect(ds.dsComponentUses).toBe(1); // SummaryCard의 Card

    // 테마에 없는 colors.warning: dsmith는 token으로 세지 않고(dynamic), 독립 채점은 JS 테마 참조로 센다
    const badge = r1.runs.find((r) => r.prompt === "06-status-badge" && r.condition === "dsmith")!;
    expect(badge.score.totals.hardcoded).toBe(0);
    expect(badge.independent!.totals.themeRefs - badge.score.totals.token).toBe(1);
  }, 120_000);

  it("독립 채점: baseline은 색·길이 리터럴, dsmith는 themeRefs. 웹 항목(var)은 0", async () => {
    const r = await runBench(args());
    const sums = (cond: "baseline" | "dsmith") => {
      const t = r.runs.filter((x) => x.condition === cond).map((x) => x.independent!.totals);
      const add = (k: "themeRefs" | "colorLiterals" | "lengthLiterals" | "varDefined" | "varUndefined" | "tailwindPalette"): number => t.reduce((a, x) => a + x[k], 0);
      return { themeRefs: add("themeRefs"), colors: add("colorLiterals"), lengths: add("lengthLiterals"), vars: add("varDefined") + add("varUndefined"), palette: add("tailwindPalette") };
    };
    const b = sums("baseline");
    const d = sums("dsmith");
    expect(b.themeRefs).toBe(0);
    expect(b.colors).toBeGreaterThan(10);
    expect(b.lengths).toBeGreaterThan(15);
    expect(d.themeRefs).toBeGreaterThan(25);
    expect(d.colors).toBe(0);
    expect(b.vars + d.vars + b.palette + d.palette).toBe(0);
    for (const run of r.runs) {
      if (run.condition === "baseline") expect(run.independent!.indepUsage, run.prompt).toBe(0);
      else expect(run.independent!.indepUsage!, run.prompt).toBeGreaterThan(0.8);
    }
  }, 120_000);

  it("bench:replay 스크립트가 공개 rn-app 세트도 돌린다", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(MONOREPO_ROOT, "benchmarks/package.json"), "utf-8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["bench:replay"]).toContain("--repo rn-app --replay-set rn-app");
    for (const id of PROMPTS) {
      for (const cond of ["baseline", "dsmith"]) {
        const dir = path.join(REPLAY, cond, id, "1");
        expect(fs.existsSync(path.join(dir, "run.json")), dir).toBe(true);
      }
    }
  });
});

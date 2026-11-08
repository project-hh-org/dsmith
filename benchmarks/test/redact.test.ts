import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MONOREPO_ROOT } from "../src/base.js";
import type { BenchResult, RunRecord } from "../src/model.js";
import { redactResult, redactedJson, renderRedactedReport } from "../src/redact.js";
import { reportFromFile } from "../src/report.js";
import { parseBenchArgs, runBench } from "../src/run.js";
import { cleanupTmps, tmpDir } from "./helpers.js";

afterAll(cleanupTmps);

const REPLAY = path.join(MONOREPO_ROOT, "benchmarks/replay/rn-app");
const SECRET_FILE = "src/secret/PrivatePayments.tsx";
const SECRETS = [
  SECRET_FILE,
  "PrivatePayments",
  "zzSecretBrand",
  "--secret-var",
  "SecretWidget",
  "src/private/Widget",
  "/Users/dahee/secret-app",
  "ENOENT",
  "claude -p --secret-flag",
  "sk-live-abc",
];

/** 비공개 앱 결과를 흉내 낸 입력: 모든 문자열 필드에 새면 안 되는 표식을 심는다 */
function privateLikeResult(base: BenchResult): BenchResult {
  const run = (r: RunRecord): RunRecord => ({
    ...r,
    error: "ENOENT /Users/dahee/secret-app/src/secret/PrivatePayments.tsx sk-live-abc",
    agentMeta: { costUsd: 0.05, turns: 3, models: ["claude-sonnet"], mcpToolCalls: 2, permissionDenials: 0 },
    score: {
      ...r.score,
      files: [
        ...r.score.files.map((f) => ({
          ...f,
          file: SECRET_FILE,
          nonDsDetails: [{ name: "SecretWidget", module: "src/private/Widget", preferModule: "src/ui/Widget" }],
        })),
        { file: "src/secret/Other.tsx", status: "added" as const, parseFailed: false, introduced: { token: 0, knownToken: 0, hardcoded: 0, replaceable: 0, tailwindDefault: 0, dynamic: 0 }, nonDs: 0, deprecated: 0, dsComponentUses: 0, nonDsDetails: [] },
      ],
    },
    ...(r.independent === undefined ? {} : { independent: { ...r.independent, undefinedVars: ["--secret-var"], files: r.independent.files.map((f) => ({ ...f, file: SECRET_FILE, undefinedVars: ["--secret-var"] })) } }),
    typeCheck: { mode: "구문·의미 검사(의존성 타입 없이)", filesChecked: 1, typeErrors: 1, diagnostics: [{ file: SECRET_FILE, line: 3, code: 2339, message: "Property 'zzSecretBrand' does not exist on type 'colors.zzSecretBrand'" }] },
  });
  return {
    ...base,
    repo: "knowing-saju",
    mode: "agent",
    agent: { command: "claude -p --secret-flag", version: "1.2.3", installTool: "claude-code", models: ["claude-sonnet"] },
    runs: base.runs.map(run),
  };
}

function allStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) allStrings(x, out);
  else if (typeof v === "object" && v !== null) {
    for (const [k, x] of Object.entries(v)) {
      out.push(k);
      allStrings(x, out);
    }
  }
  return out;
}

describe("리댁션 — 비공개 레포 결과", () => {
  let real: BenchResult;
  let priv: BenchResult;

  beforeAll(async () => {
    real = await runBench(parseBenchArgs(["--repo", "rn-app", "--replay", REPLAY, "--prompts", "04-summary-card,06-status-badge,10-settings-screen", "--date", "2026-11-08"]));
    priv = privateLikeResult(JSON.parse(JSON.stringify(real)) as BenchResult);
  }, 120_000);

  /** 프롬프트 file(공개 벤치마크 프롬프트)을 뺀 나머지에 경로 모양 문자열이 없어야 한다 */
  const assertClean = (text: string, promptFiles: string[]): void => {
    let rest = text;
    for (const f of promptFiles) rest = rest.split(f).join("");
    expect(rest, "경로 모양(/ 포함) 문자열").not.toContain("/");
    expect(rest).not.toMatch(/\\/);
    expect(text).not.toMatch(/\b(?:colors|spacing|radius|typography)\./);
    for (const secret of SECRETS) expect(text, secret).not.toContain(secret);
    expect(rest).not.toMatch(/\.(?:tsx?|jsx?|json|css)\b/);
  };

  it("md와 요약 JSON에 프롬프트 file 외의 경로·토큰 이름·finding 메시지·undefinedVars·오류 문구가 없다", () => {
    const r = redactResult(priv);
    const files = r.prompts.map((p) => p.file);
    assertClean(renderRedactedReport(r), files);
    assertClean(redactedJson(r), files);
    // 모든 문자열(키 포함)을 훑는다: `/`가 든 문자열은 prompts[].file뿐
    const slashed = allStrings(JSON.parse(redactedJson(r))).filter((s) => s.includes("/"));
    expect([...new Set(slashed)].sort()).toEqual([...files].sort());
  });

  it("실제(공개 합성) 결과도 같은 기준을 통과한다 — 파일 이름·타입 진단 메시지가 원본에는 있다", () => {
    expect(JSON.stringify(real)).toContain("Property 'warning' does not exist");
    expect(JSON.stringify(real)).toContain("src/components/StatusBadge.tsx");
    const r = redactResult(real);
    const files = r.prompts.map((p) => p.file);
    const md = renderRedactedReport(r);
    const json = redactedJson(r);
    for (const text of [md, json]) {
      let rest = text;
      for (const f of files) rest = rest.split(f).join("");
      expect(rest).not.toContain("/");
      expect(text).not.toContain("does not exist");
      expect(text).not.toMatch(/\b(?:colors|spacing|radius|typography)\./);
    }
  });

  it("수치는 남는다: 프롬프트·조건·반복, 실행별 metrics, 집계, themeRefs, otherFiles", () => {
    const r = redactResult(real);
    expect(r).toMatchObject({ repo: "rn-app", date: "2026-11-08", mode: "replay", repeat: 1, conditions: ["baseline", "dsmith"] });
    expect(r.snapshotSha256).toBe(real.base.snapshotSha256);
    expect(r.prompts.map((p) => p.id)).toEqual(["04-summary-card", "06-status-badge", "10-settings-screen"]);
    expect(r.runs).toHaveLength(6);
    expect(r.runs.map((x) => `${x.prompt}|${x.condition}|${x.rep}`)).toEqual([
      "04-summary-card|baseline|1",
      "04-summary-card|dsmith|1",
      "06-status-badge|baseline|1",
      "06-status-badge|dsmith|1",
      "10-settings-screen|baseline|1",
      "10-settings-screen|dsmith|1",
    ]);
    for (const run of r.runs) {
      expect(run.otherFiles).toBe(0);
      for (const v of Object.values(run.metrics)) expect(v === null || typeof v === "number").toBe(true);
    }
    const ds = r.runs.find((x) => x.prompt === "06-status-badge" && x.condition === "dsmith")!;
    expect(ds.metrics).toMatchObject({ ok: 1, expectedFile: 1, hardcoded: 0, themeRefs: 9, colorLiterals: 0, typeErrors: 1 });
    expect(r.summary.conditions.dsmith?.aggregate.token).toBe(real.aggregate.dsmith?.token);
    expect(r.summary.conditions.dsmith?.independent?.["themeRefs"]).toBeGreaterThan(25);
    expect(r.summary.pairs.map((p) => `${p.metric}:${p.ref}>${p.cmp}`)).toEqual(["usage:baseline>dsmith", "indepUsage:baseline>dsmith"]);
  });

  it("다른 파일을 건드린 실행은 otherFiles로 센다(이름은 버린다)", () => {
    const r = redactResult(priv);
    for (const run of r.runs) expect(run.otherFiles).toBe(1);
  });

  it("같은 입력이면 md·JSON이 바이트까지 같다, 입력은 바뀌지 않는다", () => {
    const before = JSON.stringify(priv);
    const a = redactResult(priv);
    const b = redactResult(JSON.parse(before) as BenchResult);
    expect(redactedJson(a)).toBe(redactedJson(b));
    expect(renderRedactedReport(a)).toBe(renderRedactedReport(b));
    expect(JSON.stringify(priv)).toBe(before);
  });

  describe("입력 검증 — 결과 JSON의 문자열을 믿지 않는다", () => {
    const clone = (): BenchResult => JSON.parse(JSON.stringify(priv)) as BenchResult;
    const SECRET = "/Users/dahee/secret-app";

    it("repo·date·mode·conditions가 허용 값이 아니면 거부하고, 오류 문구에 입력 값을 싣지 않는다", () => {
      const cases: [string, (r: BenchResult) => void][] = [
        ["repo", (r) => void (r.repo = SECRET as never)],
        ["date", (r) => void (r.date = `2026-11-08 ${SECRET}`)],
        ["mode", (r) => void (r.mode = SECRET as never)],
        ["conditions", (r) => void (r.conditions = [SECRET as never])],
      ];
      for (const [field, mutate] of cases) {
        const r = clone();
        mutate(r);
        let message = "";
        try {
          redactResult(r);
        } catch (e) {
          message = (e as Error).message;
        }
        expect(message, field).toContain(field);
        expect(message, field).not.toContain("secret-app");
      }
    });

    it("prompts는 커밋된 공개 RN 프롬프트 (id, file)과 같아야 한다 — 다른 id·file·run.prompt는 거부", () => {
      const bad = clone();
      bad.prompts[0] = { ...bad.prompts[0]!, file: "src/secret/PrivatePayments.tsx" };
      expect(() => redactResult(bad)).toThrow(/prompts/);
      const unknownId = clone();
      unknownId.prompts[0] = { ...unknownId.prompts[0]!, id: "99-secret" };
      expect(() => redactResult(unknownId)).toThrow(/prompts/);
      const run = clone();
      run.runs[0] = { ...run.runs[0]!, prompt: "99-secret" };
      expect(() => redactResult(run)).toThrow(/prompt/);
    });

    it("aggregate는 알려진 숫자 키만 복사한다 — 손으로 넣은 문자열·알 수 없는 키는 버린다", () => {
      const r = clone();
      const agg = r.aggregate.dsmith as unknown as Record<string, unknown>;
      agg["note"] = SECRET;
      agg["secretCount"] = 7;
      agg["token"] = Number(agg["token"]);
      const out = redactResult(r);
      const copied = out.summary.conditions.dsmith!.aggregate as unknown as Record<string, unknown>;
      expect(copied).not.toHaveProperty("note");
      expect(copied).not.toHaveProperty("secretCount");
      expect(Object.values(copied).every((v) => v === null || typeof v === "number")).toBe(true);
      expect(redactedJson(out)).not.toContain("secret-app");
      // 알려진 키에 숫자가 아닌 값이 들어 있으면 거부한다(값은 오류에 싣지 않는다)
      const s = clone();
      (s.aggregate.dsmith as unknown as Record<string, unknown>)["token"] = SECRET;
      expect(() => redactResult(s)).toThrow(/aggregate/);
    });
  });

  it("bench:report --redact: md와 --summary-json을 쓰고, 두 번 써도 같다", () => {
    const dir = tmpDir("dsmith-bench-redact-");
    const input = path.join(dir, "ks.json");
    fs.writeFileSync(input, `${JSON.stringify(priv, null, 2)}\n`);
    const out = path.join(dir, "pub/ks.md");
    const sum = path.join(dir, "pub/ks.summary.json");
    const first = reportFromFile(["--redact", "--in", input, "--out", out, "--summary-json", sum]);
    expect(first).toMatchObject({ mdFile: out, line: null, jsonFile: sum });
    const md1 = fs.readFileSync(out, "utf-8");
    const json1 = fs.readFileSync(sum, "utf-8");
    reportFromFile(["--redact", "--in", input, "--out", out, "--summary-json", sum]);
    expect(fs.readFileSync(out, "utf-8")).toBe(md1);
    expect(fs.readFileSync(sum, "utf-8")).toBe(json1);
    expect(md1).toBe(renderRedactedReport(redactResult(priv)));
    expect(JSON.parse(json1)).toMatchObject({ repo: "knowing-saju" });
  });

  it("--redact는 --out이 필수, --in 하나, --summary-json은 --redact와 함께만", () => {
    const dir = tmpDir("dsmith-bench-redact-args-");
    const input = path.join(dir, "ks.json");
    fs.writeFileSync(input, JSON.stringify(priv));
    expect(() => reportFromFile(["--redact", "--in", input])).toThrow(/--out/);
    expect(() => reportFromFile(["--redact", "--in", input, "--in", input, "--out", path.join(dir, "a.md")])).toThrow(/하나/);
    expect(() => reportFromFile(["--in", input, "--summary-json", path.join(dir, "s.json"), "--out", path.join(dir, "a.md")])).toThrow(/--redact/);
  });

  it("비공개 레포의 전체(비리댁션) 보고서는 모노레포 안에 쓰지 않는다 — 밖에는 쓴다", () => {
    const dir = tmpDir("dsmith-bench-redact-guard-");
    const input = path.join(dir, "ks.json");
    fs.writeFileSync(input, JSON.stringify(priv));
    const inside = path.join(MONOREPO_ROOT, "benchmarks/results/zz-redact-guard-test.md");
    expect(() => reportFromFile(["--in", input, "--out", inside])).toThrow(/모노레포 안에 쓰지 않습니다/);
    expect(fs.existsSync(inside)).toBe(false);
    const outside = path.join(dir, "full.md");
    reportFromFile(["--in", input, "--out", outside]);
    expect(fs.existsSync(outside)).toBe(true);
  });
});

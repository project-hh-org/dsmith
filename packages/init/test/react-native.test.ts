import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GENERATED_NOTICE, buildTokenDraft, readIndex, readJsThemeTokens, type Index } from "@dsmith-dev/core";
import { readDetect } from "@dsmith-dev/detect";
import { planMigration } from "@dsmith-dev/migrate";
import { formatInitSummary, runInit, type InitResult } from "../src/run.js";
import { ALL_EXTRACTORS, auditFixture, copyFixture, listFiles, treeHash } from "./helpers.js";

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

const NOW = new Date(2026, 10, 1, 12);
const run = (root: string, extra: Partial<Parameters<typeof runInit>[0]> = {}): Promise<InitResult> =>
  runInit({ root, version: "0.0.0-test", now: NOW, all: true, ...extra });
const read = (root: string, rel: string): string => fs.readFileSync(path.join(root, rel), "utf-8");
const sha = (root: string, rel: string): string => createHash("sha256").update(read(root, rel)).digest("hex");

async function rnApp(overlay: Record<string, string> = {}, withoutTheme = false): Promise<string> {
  const root = copyFixture("fixtures/rn-app", overlay);
  roots.push(root);
  if (withoutTheme) fs.rmSync(path.join(root, "src/theme.ts"));
  await auditFixture(root);
  return root;
}

const PLAIN_APP = `import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>안녕</Text>
      <View style={{ padding: 8, backgroundColor: "#3b82f6" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8, backgroundColor: "#ffffff" },
  title: { fontSize: 24, color: "#111111", marginBottom: 8, borderRadius: 8 },
  card: { padding: 16, borderRadius: 8, backgroundColor: "#3b82f6" },
});
`;
const OLD_CSS = `/* ${GENERATED_NOTICE} */\n:root {\n  --ds-color-gray-50: #ffffff;\n}\n`;
const OLD_JSON = `{\n  "$description": "${GENERATED_NOTICE}",\n  "color": {}\n}\n`;
const LEGACY_WARNING = "react-native 레포에서는 design-system/tokens.css·tokens.json을 쓰지 않음 — 필요 없으면 지워도 됨";

describe("runInit: React Native + JS 테마가 있는 앱(fixtures/rn-app)", () => {
  it("토큰 파일 없이 그 테마를 쓴다: tokenSource js-theme, 스캐폴드 0 + 사유, 프리셋 null", async () => {
    const root = await rnApp();
    const r = await run(root);

    expect(r.tokenSource).toEqual({ kind: "js-theme", files: ["src/theme.ts"] });
    expect(r.outcomes).toEqual([]);
    expect(fs.existsSync(path.join(root, "design-system"))).toBe(false);
    expect(r.scaffolds).toEqual([]);
    expect(r.skippedScaffolds).toEqual([{ item: "react-native", reason: "웹 스캐폴드 템플릿이라 만들지 않음" }]);
    expect(r.tailwindPreset).toBeNull();
    expect(r.tokensLoaded).toBeNull();
    expect(r.tokenHold).toBeNull();
    // 토큰 수·커버리지는 테마(src/theme.ts) 기준: 색 7 · 간격 4 · 모서리 3 · 글꼴 크기 3(typography.*.fontSize)
    expect(r.tokens).toEqual({ color: 7, spacing: 4, radius: 3, fontSize: 3, total: 17, mergedValues: 17 });
    expect(r.coverage.total).toBeGreaterThan(0);
    expect(r.coverage.replaceable).toBeGreaterThan(0);
    expect(r.mappings).toEqual([]);

    const text = formatInitSummary(r);
    expect(text).toContain("토큰: 기존 JS 테마 사용 — src/theme.ts (색 7 · 간격 4 · 모서리 3 · 글꼴 크기 3)");
    expect(text).not.toContain("tokens.{json,css,ts}");
    expect(text).toContain("스캐폴드: 만들지 않음 (react-native: 웹 스캐폴드 템플릿이라 만들지 않음)");

    const report = read(root, r.report as string);
    expect(report).toContain("기존 JS 테마 사용");
    expect(report).not.toContain("--ds-");
  });

  it("두 번째 실행도 쓰기 0, dry-run도 같은 판단에 쓰기 없음", async () => {
    const root = await rnApp();
    const dry = await run(root, { dryRun: true });
    expect(dry.tokenSource.kind).toBe("js-theme");
    expect(dry.report).toBeNull();
    const before = treeHash(root);
    await run(root);
    const afterFirst = treeHash(root);
    const second = await run(root);
    expect(treeHash(root)).toBe(afterFirst);
    expect(second.outcomes.every((o) => o.status === "unchanged")).toBe(true);
    expect(before).not.toBe("");
    expect(fs.existsSync(path.join(root, "design-system"))).toBe(false);
  });

  it("이전 init 산출(tokens.css·tokens.json)은 지우지도 다시 쓰지도 않고 경고 1개", async () => {
    const root = await rnApp({ "design-system/tokens.css": OLD_CSS, "design-system/tokens.json": OLD_JSON });
    const cssBefore = sha(root, "design-system/tokens.css");
    const jsonBefore = sha(root, "design-system/tokens.json");
    const r = await run(root);

    expect(r.tokenSource).toEqual({ kind: "js-theme", files: ["src/theme.ts"] });
    expect(sha(root, "design-system/tokens.css")).toBe(cssBefore);
    expect(sha(root, "design-system/tokens.json")).toBe(jsonBefore);
    expect(listFiles(root, "design-system").sort()).toEqual(["design-system/tokens.css", "design-system/tokens.json"]);
    expect(r.warnings.filter((w) => w.includes("tokens.css"))).toEqual([LEGACY_WARNING]);
    expect(r.warnings).toHaveLength(1);
  });
});

describe("runInit: React Native + 테마가 없는 앱(fixtures/rn-app에서 src/theme.ts를 지운 사본)", () => {
  it("design-system/tokens.ts만 쓴다(RN 형식, 숫자는 number 리터럴)", async () => {
    const root = await rnApp({}, true);
    const r = await run(root);

    expect(listFiles(root, "design-system")).toEqual(["design-system/tokens.ts"]);
    expect(r.tokenSource).toEqual({ kind: "init-files", files: ["design-system/tokens.ts"] });
    expect(r.outcomes.map((o) => o.status)).toEqual(["created"]);
    expect(r.scaffolds).toEqual([]);
    expect(r.tailwindPreset).toBeNull();
    expect(r.tokensLoaded).toBeNull();

    const code = read(root, "design-system/tokens.ts");
    expect(code.startsWith(`// ${GENERATED_NOTICE}\n`)).toBe(true);
    expect(code).toMatch(/export const colors = \{\n(?: {2}[A-Za-z_][\w]*: "#[0-9a-f]{6}",\n)+\} as const;/);
    expect(code).toMatch(/export const spacing = \{\n(?: {2}\d+: \d+(?:\.\d+)?,\n)+\} as const;/);
    expect(code).toMatch(/export const radius = \{\n/);
    expect(code).toMatch(/export const fontSize = \{\n/);
    expect(code).not.toMatch(/"\d+px"|\bpx\b|var\(--/);

    const text = formatInitSummary(r);
    expect(text).toContain("→ design-system/tokens.ts");
    expect(text).not.toContain("tokens.{json,css,ts}");
  });

  it("readJsThemeTokens로 다시 읽으면 초안과 (category, normalized) 집합이 같다", async () => {
    const root = await rnApp({}, true);
    const index = (await readIndex(root)) as Index;
    const draft = buildTokenDraft(index.styles, { excludeDirs: ["design-system"] });
    await run(root);

    const reread = readJsThemeTokens(read(root, "design-system/tokens.ts"), "design-system/tokens.ts", {
      module: "design-system/tokens",
    });
    const key = (t: { category: string; normalized: unknown }): string => `${t.category}|${JSON.stringify(t.normalized)}`;
    expect(draft.tokens.length).toBeGreaterThan(0);
    expect(reread.tokens.map(key).sort()).toEqual(draft.tokens.map(key).sort());
    expect(reread.exports).toEqual(expect.arrayContaining(["colors", "spacing"]));
    expect(reread.warnings).toEqual([]);
  });

  it("이어서 migrate 계획이 그 토큰을 JS 테마 참조 spacing[2]·colors.blue400과 import로 쓴다(합성 RN 레포)", async () => {
    const root = copyFixture("fixtures/rn-app");
    roots.push(root);
    // 테마를 import하는 파일이 없는 합성 앱: rn-app의 파일은 지운 테마를 계속 import해 `colors` 바인딩 충돌(js-binding-conflict)이 난다
    fs.rmSync(path.join(root, "src"), { recursive: true });
    fs.rmSync(path.join(root, "app"), { recursive: true });
    fs.mkdirSync(path.join(root, "app"));
    fs.writeFileSync(path.join(root, "app/index.tsx"), PLAIN_APP);
    await auditFixture(root);
    await run(root);
    expect(listFiles(root, "design-system")).toEqual(["design-system/tokens.ts"]);
    await auditFixture(root);

    const detect = await readDetect(root);
    const index = await readIndex(root);
    if (detect === null || index === null) throw new Error("audit 결과 없음");
    const plan = await planMigration({ root, extractors: ALL_EXTRACTORS, detect, index });

    expect(plan.tokens.source).toBe("token-file");
    expect(plan.tokens.files).toEqual(["design-system/tokens.ts"]);
    expect(plan.skipped).toEqual({});
    const refs = plan.files.flatMap((f) => f.replacements.map((x) => x.ref));
    expect(refs).toContain("spacing[2]");
    expect(refs).toContain("colors.blue400");
    expect(refs.every((x) => !x.startsWith("var("))).toBe(true);
    expect(plan.files.flatMap((f) => f.imports)).toContainEqual({ module: "design-system/tokens", name: "colors", local: "colors" });
    // 토큰 파일 자신은 치환 대상이 아니다
    expect(plan.files.every((f) => f.file !== "design-system/tokens.ts")).toBe(true);
  });

  it("이전 init 산출(tokens.css·tokens.json)이 있으면 그대로 두고 tokens.ts만 쓰며 경고 1개", async () => {
    const root = await rnApp({ "design-system/tokens.css": OLD_CSS, "design-system/tokens.json": OLD_JSON }, true);
    const cssBefore = sha(root, "design-system/tokens.css");
    const jsonBefore = sha(root, "design-system/tokens.json");
    const r = await run(root);

    expect(sha(root, "design-system/tokens.css")).toBe(cssBefore);
    expect(sha(root, "design-system/tokens.json")).toBe(jsonBefore);
    expect(listFiles(root, "design-system").sort()).toEqual([
      "design-system/tokens.css",
      "design-system/tokens.json",
      "design-system/tokens.ts",
    ]);
    expect(r.warnings.filter((w) => w.includes("tokens.css"))).toEqual([LEGACY_WARNING]);
  });

  it("두 번째 실행은 unchanged, 사람이 고친 tokens.ts는 보류하고 --force로 덮어쓴다", async () => {
    const root = await rnApp({}, true);
    await run(root);
    const second = await run(root);
    expect(second.outcomes.map((o) => o.status)).toEqual(["unchanged"]);

    fs.appendFileSync(path.join(root, "design-system/tokens.ts"), "// 내가 고침\n");
    const held = await run(root);
    expect(held.tokenHold).toBe("modified");
    expect(held.outcomes.map((o) => o.status)).toEqual(["skipped-modified"]);
    expect(read(root, "design-system/tokens.ts")).toContain("// 내가 고침");
    expect(formatInitSummary(held)).toContain("사람이 고친 토큰 파일");

    const forced = await run(root, { force: true });
    expect(forced.outcomes.map((o) => o.status)).toEqual(["updated"]);
    expect(read(root, "design-system/tokens.ts")).not.toContain("// 내가 고침");
  });

  it("--dry-run은 쓰지 않고 같은 판단을 보여 준다", async () => {
    const root = await rnApp({}, true);
    const before = treeHash(root);
    const r = await run(root, { dryRun: true });
    expect(treeHash(root)).toBe(before);
    expect(r.outcomes.map((o) => o.status)).toEqual(["created"]);
    expect(r.tokenSource.files).toEqual(["design-system/tokens.ts"]);
  });
});

describe("runInit: 웹 레포는 이전과 같다", () => {
  it("legacy-demo는 tokens 3종·프리셋을 쓰고 tokenSource는 init-files 3개", async () => {
    const root = copyFixture("examples/legacy-demo");
    roots.push(root);
    await auditFixture(root);
    const r = await run(root);
    expect(r.tokenSource).toEqual({
      kind: "init-files",
      files: ["design-system/tokens.json", "design-system/tokens.css", "design-system/tokens.ts"],
    });
    expect(r.outcomes.slice(0, 3).map((o) => o.status)).toEqual(["created", "created", "created"]);
    expect(formatInitSummary(r)).toContain("→ design-system/tokens.{json,css,ts}");
  });
});

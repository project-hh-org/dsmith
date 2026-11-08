import { buildTokenRefResolver, extractFileStyles, extractorMatchers, loadReplacementTokens } from "@dsmith-dev/core";
import { describe, expect, it } from "vitest";
import { applyMigration, loadModuleEnv, planMigration, revertMigration, type MigratePlan } from "../src/index.js";
import { ALL, auditFixture, loadState, makeRepo, read, treeHash } from "./helpers.js";

const THEME = `export const colors = {
  surface: "#ffffff",
  text: "#111111",
  primary: "#3b82f6",
} as const;

export const spacing = { sm: 8, md: 16 } as const;

export const radius = { card: 12 } as const;

export const typography = { caption: { fontSize: 12, fontWeight: "500" } } as const;
`;

const MODE_COLORS = `export const Colors = {
  light: { background: "#ffffff", text: "#111111" },
  dark: { background: "#000000", text: "#ffffff" },
};
`;

function rnRepo(extra: Record<string, string> = {}): string {
  return makeRepo({
    "package.json": JSON.stringify({ name: "rn", dependencies: { react: "19.0.0", "react-native": "0.79.0", expo: "53.0.0" } }),
    "src/theme.ts": THEME,
    "src/constants/Colors.ts": MODE_COLORS,
    // 테마를 import하지 않는 파일 → import 한 줄 추가
    "src/components/Card.tsx": `import React from "react";
import { View } from "react-native";

export const Card = () => <View style={{ backgroundColor: "#ffffff", padding: 8, borderRadius: 12 }} />;
`,
    // 이미 spacing을 import한 파일 → 같은 선언에 colors를 합침
    "src/components/Chip.tsx": `import { View } from 'react-native';
import { spacing } from '../theme';

export const Chip = () => <View style={{ padding: spacing.sm, backgroundColor: "#3b82f6", margin: 16 }} />;
`,
    // 문자열 일부 / 별칭 import
    "src/components/Border.tsx": `import { View } from "react-native";
import { colors as c } from "../theme";

export const Border = () => <View style={{ border: "1px solid #111111", color: "#111111" }} />;
`,
    // 같은 이름의 지역 변수 → 충돌
    "src/components/Shadow.tsx": `import { View } from "react-native";

export const Shadow = ({ colors }: { colors: string }) => <View style={{ backgroundColor: "#3b82f6", opacity: colors === "x" ? 1 : 0 }} />;
`,
    // 가까운 모드 토큰(Colors.light.background)이 있어도 쓰지 않는다
    "src/screens/Home.tsx": `import { View } from "react-native";
import { Colors } from "../constants/Colors";

export const Home = () => <View style={{ backgroundColor: "#ffffff", borderColor: Colors.light.text }} />;
`,
    ...extra,
  });
}

async function planRn(root: string): Promise<MigratePlan> {
  await auditFixture(root);
  const { detect, index, extractors } = await loadState(root);
  return planMigration({ root, extractors, detect, index });
}

describe("migrate: JS 테마 토큰", () => {
  it("테마 토큰으로 치환 계획: ref는 JS 식, 모드 토큰은 쓰지 않고, 필요한 파일에만 import를 더한다", async () => {
    const root = rnRepo();
    const plan = await planRn(root);
    expect(plan.tokens.source).toBe("token-file");
    expect(plan.tokens.files).toContain("src/theme.ts");
    expect(plan.planned).toBeGreaterThan(0);
    const all = plan.files.flatMap((f) => f.replacements);
    expect(all.every((r) => r.js !== undefined)).toBe(true);
    expect(all.every((r) => /^(colors|spacing|radius|c)\./.test(r.ref))).toBe(true);
    expect(all.some((r) => r.ref.startsWith("Colors"))).toBe(false);
    expect(new Set(all.map((r) => r.token)).has("colors.surface")).toBe(true);

    const card = plan.files.find((f) => f.file === "src/components/Card.tsx")!;
    // 사용 순서대로, 같은 module은 한 줄로
    expect(card.imports.map((i) => i.name)).toEqual(["colors", "spacing", "radius"]);
    const importPatches = card.patches.filter((p) => p.replacement.includes("import"));
    expect(importPatches).toHaveLength(1);
    expect(importPatches[0]!.replacement).toContain(`import { colors, spacing, radius } from "../theme";`);

    const chip = plan.files.find((f) => f.file === "src/components/Chip.tsx")!;
    expect(chip.imports.map((i) => i.name)).toEqual(["colors"]);
    expect(plan.notes.join("\n")).not.toMatch(/Colors\.light/);
    expect(plan.files.find((f) => f.file === "src/screens/Home.tsx")!.replacements[0]!.ref).toBe("colors.surface");
  });

  it("문자열 일부는 js-ref-in-string, 같은 이름 지역 변수는 js-binding-conflict로 건너뛴다", async () => {
    const root = rnRepo();
    const plan = await planRn(root);
    expect(plan.skipped["js-ref-in-string"] ?? 0).toBeGreaterThan(0);
    expect(plan.skippedItems.some((s) => s.reason === "js-ref-in-string" && s.file === "src/components/Border.tsx")).toBe(true);
    expect(plan.skippedItems.some((s) => s.reason === "js-binding-conflict" && s.file === "src/components/Shadow.tsx")).toBe(true);
    expect(plan.files.some((f) => f.file === "src/components/Shadow.tsx")).toBe(false);
    // 별칭 import를 그대로 쓴다
    const border = plan.files.find((f) => f.file === "src/components/Border.tsx");
    expect(border?.replacements.map((r) => r.ref)).toEqual(["c.text"]);
    expect(border?.imports).toEqual([]);
    const skipped = Object.values(plan.skipped).reduce((n, v) => n + (v ?? 0), 0);
    expect(plan.planned + skipped + plan.scope.outOfRange + plan.close.length).toBe(plan.scope.candidates);
  });

  it("--apply: 치환·import가 적용되고 재 audit에서 그 사용들이 token이며, --revert로 트리가 같아진다", async () => {
    const root = rnRepo();
    const before = treeHash(root);
    const plan = await planRn(root);
    const { extractors } = await loadState(root);
    const applied = await applyMigration(root, plan, { extractors, version: "test" });
    expect(applied.files.every((f) => f.status === "applied")).toBe(true);
    expect(applied.replaced).toBe(plan.planned);

    const card = read(root, "src/components/Card.tsx");
    expect(card).toContain(`import { colors, spacing, radius } from "../theme";`);
    expect(card).toContain("backgroundColor: colors.surface");
    expect(card).toContain("padding: spacing.sm");
    expect(card).toContain("borderRadius: radius.card");
    expect(read(root, "src/components/Chip.tsx")).toContain(`import { spacing, colors } from '../theme';`);
    expect(read(root, "src/components/Border.tsx")).toContain("color: c.text");

    // 재추출: 치환된 사용은 token
    const { detect } = await loadState(root);
    const rt = await loadReplacementTokens(root, detect.ds.tokenFiles, {
      framework: detect.framework.name,
      jsThemeFiles: (detect.ds.jsThemes ?? []).map((t) => t.file),
    });
    const resolveRef = buildTokenRefResolver(rt.allTokens, await loadModuleEnv(root));
    const styles = extractFileStyles({ root, file: "src/components/Card.tsx", code: card }, extractorMatchers(ALL), { resolveRef }).styles;
    expect(styles.filter((s) => s.source === "token").map((s) => s.property).sort()).toEqual(["background-color", "border-radius", "padding"]);
    expect(styles.some((s) => s.source === "hardcoded")).toBe(false);

    const rev = await revertMigration(root, applied.id);
    expect(rev.files.every((f) => f.status === "reverted")).toBe(true);
    expect(treeHash(root)).toBe(before);
  });

  it("두 번째 계획은 비어 있다(멱등)", async () => {
    const root = rnRepo();
    const plan = await planRn(root);
    const { extractors } = await loadState(root);
    await applyMigration(root, plan, { extractors, version: "test" });
    const again = await planRn(root);
    expect(again.planned).toBe(0);
  });

  it("웹 레포에서 아무도 import하지 않는 theme.ts(차트 설정)는 토큰이 아니다 — main처럼 '치환할 토큰이 없음'", async () => {
    const root = makeRepo({
      "package.json": JSON.stringify({ name: "web", dependencies: { react: "18", next: "14" } }),
      "src/lib/theme.ts": `export const chart = { axis: { color: "#10B981", grid: "#E5E7EB" }, bar: { fill: "#3b82f6" } };\n`,
      "src/a.tsx": `export const A = () => <div style={{ color: "#10B981", padding: 8 }} />;\n`,
    });
    await expect(planRn(root)).rejects.toThrow("치환할 토큰이 없음");
  });

  it("웹 레포(CSS 토큰 + JS 테마)는 CSS 변수로만 치환하고 import를 더하지 않는다", async () => {
    const root = makeRepo({
      "package.json": JSON.stringify({ name: "web", dependencies: { react: "18", next: "14" } }),
      "design-system/tokens.css": ":root { --ds-color-brand: #3b82f6; --ds-space-2: 8px; }\n",
      "src/lib/theme.ts": `export const theme = { primary: "#3b82f6", muted: "#6b7280" };\n`,
      "src/a.tsx": `import { theme } from "./lib/theme";\nexport const A = () => <div style={{ color: "#3b82f6", padding: 8, background: theme.muted }} />;\n`,
    });
    const plan = await planRn(root);
    const refs = plan.files.flatMap((f) => f.replacements.map((r) => r.ref));
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.every((r) => r.startsWith("var(--"))).toBe(true);
    expect(plan.files.every((f) => f.imports.length === 0)).toBe(true);
    expect(plan.files.flatMap((f) => f.replacements).every((r) => r.js === undefined)).toBe(true);
  });
});

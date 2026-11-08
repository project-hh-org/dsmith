import fs from "node:fs";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { staleGuardTokenFiles } from "@dsmith-dev/core";
import type { DetectResult } from "@dsmith-dev/detect";
import { buildGuardSnapshot } from "../src/index.js";
import { audit, cleanupTmps, cloneRepo, keep, makeRepo, monoRepo, preparedDemo } from "./helpers.js";

afterEach(cleanupTmps);
afterAll(() => fs.rmSync(prepared.root, { recursive: true, force: true }));

let prepared: { root: string; detect: DetectResult };
beforeAll(async () => {
  prepared = await preparedDemo();
  keep(prepared.root);
}, 120_000);

describe("buildGuardSnapshot", () => {
  it("npm 디자인시스템이면 ds.modules에 패키지 이름이 들어가고 정렬돼 있다", async () => {
    const root = cloneRepo(prepared.root);
    const detect: DetectResult = { ...prepared.detect, ds: { ...prepared.detect.ds, kind: "npm", packageName: "@acme/ui", packageNames: ["@acme/ui", "@acme/icons"] } };
    const snap = await buildGuardSnapshot({ root, detect, version: "0.1.0", existing: null });
    expect(snap.ds.modules).toEqual(expect.arrayContaining(["@acme/icons", "@acme/ui"]));
    expect(snap.ds.modules).toEqual([...snap.ds.modules].sort());
    expect(snap.ds.modules.indexOf("@acme/icons")).toBeLessThan(snap.ds.modules.indexOf("@acme/ui"));
  });

  it("packageNames 없이 packageName만 있어도 modules에 들어간다", async () => {
    const root = cloneRepo(prepared.root);
    const { packageNames: _drop, ...ds } = prepared.detect.ds;
    void _drop;
    const detect: DetectResult = { ...prepared.detect, ds: { ...ds, kind: "npm", packageName: "@acme/ui" } };
    const snap = await buildGuardSnapshot({ root, detect, version: "0.1.0", existing: null });
    expect(snap.ds.modules).toContain("@acme/ui");
  });

  it("모노레포 하위 디렉터리 root에서도 절대 경로·toplevel 경로 없이 root 상대 경로만 담는다", async () => {
    const { top, root } = monoRepo(prepared.root);
    const snap = await buildGuardSnapshot({ root, detect: prepared.detect, version: "0.1.0", existing: null });
    const text = JSON.stringify(snap);
    expect(text).not.toContain(top);
    expect(snap.tokenFiles.map((t) => t.file)).toEqual(expect.arrayContaining(["tailwind.config.ts"]));
    expect(snap.tokenFiles.every((t) => !t.file.startsWith("apps/"))).toBe(true);
    expect(await staleGuardTokenFiles(root, snap)).toEqual([]);
  });

  it("토큰 파일 이름을 바꾸면 옛 경로가 stale로 잡힌다", async () => {
    const root = cloneRepo(prepared.root);
    const snap = await buildGuardSnapshot({ root, detect: prepared.detect, version: "0.1.0", existing: null });
    fs.renameSync(path.join(root, "tailwind.config.ts"), path.join(root, "tailwind.config.renamed.ts"));
    expect(await staleGuardTokenFiles(root, snap)).toEqual(["tailwind.config.ts"]);
  });

  it("JS 테마 토큰이 없는 레포(legacy-demo)의 tokens에는 js 필드가 없다 — 웹은 CSS 토큰만 담는다", async () => {
    const snap = await buildGuardSnapshot({ root: prepared.root, detect: prepared.detect, version: "0.1.0", existing: null });
    expect(snap.tokens.length).toBeGreaterThan(0);
    expect(snap.tokens.some((t) => "js" in t)).toBe(false);
    expect(JSON.stringify(snap)).not.toContain('"js"');
  });

  it("react-native 레포는 JS 테마 토큰을 js 필드와 함께 담고, 두 번째 실행은 바이트가 같다", async () => {
    const root = makeRepo({
      "package.json": JSON.stringify({ name: "rn", dependencies: { react: "19.0.0", "react-native": "0.79.0" } }),
      "src/theme.ts": `export const colors = { surface: "#ffffff", text: "#111111" } as const;\nexport const spacing = { sm: 8, md: 16 } as const;\n`,
      "src/A.tsx": `import { View } from "react-native";\nimport { colors } from "./theme";\nexport const A = () => <View style={{ backgroundColor: colors.surface, padding: 8 }} />;\n`,
    });
    const detect = await audit(root);
    const first = await buildGuardSnapshot({ root, detect, version: "0.1.0", existing: null });
    const surface = first.tokens.find((t) => t.name === "colors.surface");
    expect(surface?.js).toEqual({ module: "src/theme", export: "colors", path: ["surface"] });
    expect(first.tokenFiles.map((t) => t.file)).toContain("src/theme.ts");
    expect(first.exclude).toContain("src/theme.ts");
    const second = await buildGuardSnapshot({ root, detect, version: "0.1.0", existing: first });
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});

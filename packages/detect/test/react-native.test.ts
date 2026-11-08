import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ExtractorMeta } from "@dsmith-dev/extractor-api";
import { detect, isDsSpecifier } from "../src/index.js";

const fixture = fileURLToPath(new URL("../../../fixtures/rn-app", import.meta.url));

const RN: ExtractorMeta = {
  name: "react-native-stylesheet",
  files: ["**/*.{tsx,jsx,ts,js}"],
  parses: "tsx",
  signals: { dependencies: ["react-native"], code: "StyleSheet\\.create\\(" },
};
const INLINE: ExtractorMeta = { name: "inline-style", files: ["**/*.{tsx,jsx,ts,js}"], parses: "tsx" };
const AVAILABLE = [INLINE, RN];

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dsmith-detect-rn-"));
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

function copyFixture(): void {
  fs.cpSync(fixture, tmp, { recursive: true, filter: (p) => !p.split(path.sep).includes(".dsmith") });
}

function write(rel: string, content: string): void {
  const abs = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

describe("fixtures/rn-app detect", () => {
  it("react-native-stylesheet만 방식으로 남고 inline-style은 대체되며, 근거에 supersedes가 남는다", async () => {
    copyFixture();
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.framework.name).toBe("react-native");
    expect(r.styling.methods.map((m) => m.name)).toEqual(["react-native-stylesheet"]);
    expect(r.styling.methods[0]?.evidence).toContain("supersedes: inline-style");
    expect(r.activeExtractors).toEqual(["react-native-stylesheet"]);
  });

  it("overrides.activeExtractors로 inline-style을 되돌릴 수 있다", async () => {
    copyFixture();
    write(".dsmith/detect.json", JSON.stringify({ overrides: { activeExtractors: ["react-native-stylesheet", "inline-style"] } }));
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.activeExtractors).toEqual(["react-native-stylesheet", "inline-style"]);
  });

  it("파일형 로컬 DS(src/components/ui.tsx)와 사용 증거가 있는 JS 테마를 찾는다", async () => {
    copyFixture();
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.ds.kind).toBe("local");
    expect(r.ds.dir).toBe("src/components/ui");
    expect(r.ds.entry).toBe("src/components/ui.tsx");
    expect(r.ds.jsThemes).toHaveLength(1);
    const [theme] = r.ds.jsThemes!;
    expect(theme?.file).toBe("src/theme.ts");
    expect(theme?.module).toBe("src/theme");
    expect(theme?.exports).toEqual(["colors", "spacing", "radius", "typography"]);
    expect(theme?.importers).toBeGreaterThanOrEqual(1);
    expect(r.ds.tokenFiles).toContain("src/theme.ts");
    expect(isDsSpecifier("src/components/ui", r.ds)).toBe(true);
    expect(isDsSpecifier("src/components/ui/button", r.ds)).toBe(true);
  });

  it("웹 프레임워크에서는 inline-style을 빼지 않는다", async () => {
    write("package.json", JSON.stringify({ dependencies: { next: "^14", react: "^18", "react-native-web": "^0.19", "react-native": "0.76.0" } }));
    write("app/page.tsx", 'import { StyleSheet } from "react-native";\nexport default function P() { return <div style={{ color: "red" }} />; }\nconst s = StyleSheet.create({ a: { padding: 4 } });\n');
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.framework.name).toBe("next");
    expect(r.styling.methods.map((m) => m.name)).toEqual(["inline-style", "react-native-stylesheet"]);
  });
});

describe("JS 테마 사용 증거", () => {
  it("import되지 않은 토큰 모양 파일(src/colors.ts)은 jsThemes에 없다", async () => {
    copyFixture();
    write("src/colors.ts", 'export const palette = { a: "#111111", b: "#222222", c: "#333333" } as const;\n');
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.ds.jsThemes?.map((t) => t.file)).toEqual(["src/theme.ts"]);
    expect(r.ds.tokenFiles).not.toContain("src/colors.ts");
  });

  it("import된 colors.ts는 jsThemes에 들어가고 tokenFiles에도 실린다 (경로 정렬)", async () => {
    copyFixture();
    write("src/colors.ts", 'export const palette = { a: "#111111", b: "#222222" } as const;\n');
    write("src/use.ts", 'import { palette } from "./colors";\nexport const x = palette.a;\n');
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.ds.jsThemes?.map((t) => t.file)).toEqual(["src/colors.ts", "src/theme.ts"]);
    expect(r.ds.jsThemes?.[0]).toEqual({ file: "src/colors.ts", module: "src/colors", exports: ["palette"], importers: 1 });
    expect(r.ds.tokenFiles).toContain("src/colors.ts");
  });

  it("토큰이 아닌 설정 객체(chartConfig)는 import돼도 jsThemes에 없다", async () => {
    copyFixture();
    write("src/theme/index.ts", 'export const chartConfig = { series: [{ name: "a", data: [1, 2, 3] }], title: "t" };\n');
    write("src/use.ts", 'import { chartConfig } from "./theme";\nexport const x = chartConfig;\n');
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.ds.jsThemes?.map((t) => t.file)).toEqual(["src/theme.ts"]);
  });

  it("토큰이 2개 미만이면 import돼도 테마가 아니다", async () => {
    write("package.json", JSON.stringify({ dependencies: { react: "^18" } }));
    write("src/theme.ts", 'export const colors = { a: "#111111" } as const;\n');
    write("src/use.ts", 'import { colors } from "./theme";\nexport const x = colors.a;\n');
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.ds.jsThemes).toBeUndefined();
  });

  it("tsconfig 별칭(@/theme)으로 import해도 importers에 센다", async () => {
    write("package.json", JSON.stringify({ dependencies: { react: "^18" } }));
    write("tsconfig.json", JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } } }));
    write("src/theme.ts", 'export const colors = { a: "#111111", b: "#222222" } as const;\n');
    write("app/x.tsx", 'import { colors } from "@/theme";\nexport const x = colors.a;\n');
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.ds.jsThemes).toEqual([{ file: "src/theme.ts", module: "src/theme", exports: ["colors"], importers: 1 }]);
  });

  it("jsThemes가 없으면 필드 자체가 없다 (웹 fixture 출력 불변)", async () => {
    write("package.json", JSON.stringify({ dependencies: { react: "^18" } }));
    write("src/A.tsx", "export const A = 1;\n");
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect("jsThemes" in r.ds).toBe(false);
    expect("entry" in r.ds).toBe(false);
  });
});

describe("파일형 로컬 DS", () => {
  it("디렉터리 DS가 있으면 디렉터리가 이긴다 (entry 없음)", async () => {
    write("package.json", JSON.stringify({ dependencies: { react: "^18" } }));
    write("src/components/ui/button.tsx", "export const Button = () => null;\n");
    write("src/components/ui.tsx", "export const Card = () => null;\n");
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.ds).toMatchObject({ kind: "local", dir: "src/components/ui" });
    expect(r.ds.entry).toBeUndefined();
  });

  it("src/ui.ts 같은 다른 확장자도 찾는다", async () => {
    write("package.json", JSON.stringify({ dependencies: { react: "^18" } }));
    write("src/ui.ts", "export const Card = () => null;\n");
    const r = await detect(tmp, undefined, { available: AVAILABLE });
    expect(r.ds).toMatchObject({ kind: "local", dir: "src/ui", entry: "src/ui.ts" });
  });
});

import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runInit, type InitResult } from "../src/run.js";
import { auditFixture, copyFixture, forceStateZero } from "./helpers.js";
import {
  buildTw4,
  layerThemeVariables,
  squash,
  tailwindThemeVariables,
  tailwindVersion,
  unlayeredRootVariables,
} from "./tailwind4.js";

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

const PKG_V4 = JSON.stringify({
  name: "tw4",
  dependencies: { next: "^14.2.5", react: "^18.3.1", "react-dom": "^18.3.1", tailwindcss: "^4.1.0" },
});
const ENTRY = '@import "tailwindcss";\n@import "../design-system/tailwind.theme.css";\n@import "../design-system/tokens.css";\n';

interface Built {
  root: string;
  result: InitResult;
  tokenVars: string[];
  theme: string;
  keys: { color: string[]; spacing: string[]; radius: string[]; text: string[] };
  css: string;
}

/** legacy-demo를 Tailwind 4 레포로 바꿔(package.json만) init하고, 테마 파일의 클래스 키로 실제 v4 빌드를 돌린다 */
async function buildRepo(naming: "ds" | "legacy"): Promise<Built> {
  const root = copyFixture("examples/legacy-demo", { "package.json": PKG_V4, "app/entry.css": ENTRY });
  roots.push(root);
  await auditFixture(root);
  await forceStateZero(root);
  const result = await runInit({ root, version: "0.0.0-test", now: new Date(2026, 10, 8, 12), all: true, naming });
  expect(result.tailwindPreset?.version).toBe(4);
  const tokensCss = fs.readFileSync(path.join(root, "design-system/tokens.css"), "utf-8");
  const theme = fs.readFileSync(path.join(root, "design-system/tailwind.theme.css"), "utf-8");
  const tokenVars = [...tokensCss.matchAll(/^\s+(--[\w-]+):/gm)].map((m) => m[1] as string);
  const keysOf = (ns: string): string[] =>
    [...theme.matchAll(new RegExp(`^\\s+--${ns}-ds-([\\w-]+):`, "gm"))].map((m) => m[1] as string);
  const keys = { color: keysOf("color"), spacing: keysOf("spacing"), radius: keysOf("radius"), text: keysOf("text") };
  const candidates = [
    ...keys.color.flatMap((k) => [`bg-ds-${k}`, `bg-ds-${k}/50`]),
    ...keys.spacing.flatMap((k) => [`p-ds-${k}`, `-mt-ds-${k}`]),
    ...keys.radius.map((k) => `rounded-ds-${k}`),
    ...keys.text.map((k) => `text-ds-${k}`),
    "bg-blue-400",
    "text-xs",
    "rounded-sm",
    "p-2",
  ];
  const css = await buildTw4(ENTRY, path.join(root, "app"), candidates);
  return { root, result, tokenVars, theme, keys, css };
}

const version = `tailwindcss ${tailwindVersion()}`;

describe(`Tailwind 4 실제 compile() (${version})`, () => {
  it("전제: 테마 변수 집합을 읽는다", () => {
    const vars = tailwindThemeVariables();
    expect(vars.size, version).toBeGreaterThan(300);
    expect(vars.has("--color-blue-400"), version).toBe(true);
    expect(vars.has("--text-xs"), version).toBe(true);
    expect(vars.has("--radius-sm"), version).toBe(true);
  });

  it("ds 형식: 기본 테마 변수와 겹치지 않고, ds 클래스가 생성되며, 기본 클래스는 Tailwind 값 그대로", async () => {
    const { tokenVars, keys, css } = await buildRepo("ds");
    // 네 그룹이 모두 있어야 이 테스트가 충돌을 대표한다
    for (const group of ["color", "spacing", "radius", "text"] as const) expect(keys[group].length, group).toBeGreaterThan(0);
    expect(tokenVars.every((v) => v.startsWith("--ds-"))).toBe(true);

    // (1) 변수 이름 교집합 0 — tokens.css ∩ Tailwind theme.css, 출력의 비레이어 :root ∩ 출력의 @layer theme
    const themeVars = tailwindThemeVariables();
    expect(tokenVars.filter((v) => themeVars.has(v)), version).toEqual([]);
    const unlayered = unlayeredRootVariables(css);
    const layered = layerThemeVariables(css);
    expect(unlayered.size, version).toBe(tokenVars.length);
    expect([...unlayered].filter((v) => layered.has(v)), version).toEqual([]);

    // (2) ds 클래스 규칙
    const out = squash(css);
    const has = (rule: string): void => expect(out, `${rule} (${version})`).toContain(rule);
    for (const k of keys.color) {
      has(`.bg-ds-${k} { background-color: var(--ds-color-${k}); }`);
      has(`color-mix(in oklab, var(--ds-color-${k}) 50%, transparent)`);
    }
    for (const k of keys.spacing) {
      has(`.p-ds-${k} { padding: var(--ds-space-${k}); }`);
      has(`.-mt-ds-${k} { margin-top: calc(var(--ds-space-${k}) * -1); }`);
    }
    for (const k of keys.radius) has(`.rounded-ds-${k} { border-radius: var(--ds-radius-${k}); }`);
    for (const k of keys.text) has(`.text-ds-${k} { font-size: var(--ds-text-${k}); }`);

    // (3) 기본 클래스는 Tailwind 기본 테마 변수를 가리키고, 그 변수는 @layer theme 한 곳에서만 정의된다
    has(".text-xs { font-size: var(--text-xs);");
    has(".bg-blue-400 { background-color: var(--color-blue-400); }");
    has(".rounded-sm { border-radius: var(--radius-sm); }");
    for (const v of ["--color-blue-400", "--text-xs", "--radius-sm"]) {
      expect(out.split(`${v}:`).length - 1, `${v} 정의 수 (${version})`).toBe(1);
      expect(layered.has(v), v).toBe(true);
      expect(unlayered.has(v), v).toBe(false);
    }
  });

  it("legacy 대조: 같은 레포에서 이전 형식은 기본 테마 변수를 덮는다(이 테스트가 충돌을 잡는다는 증명)", async () => {
    const { tokenVars, keys, css } = await buildRepo("legacy");
    expect(tokenVars.some((v) => v.startsWith("--ds-"))).toBe(false);
    const themeVars = tailwindThemeVariables();
    const overlap = tokenVars.filter((v) => themeVars.has(v));
    expect(overlap.length, version).toBeGreaterThan(0);
    expect(overlap.some((v) => v.startsWith("--color-")), version).toBe(true);
    // 비레이어 :root와 @layer theme이 같은 변수를 정의 — 비레이어가 이긴다
    const unlayered = unlayeredRootVariables(css);
    const layered = layerThemeVariables(css);
    const collided = [...unlayered].filter((v) => layered.has(v));
    expect(collided.length, version).toBeGreaterThan(0);
    for (const v of overlap) expect(unlayered.has(v), v).toBe(true);

    // 부록 A.1 관찰 3: 이전 형식에서는 ds 클래스의 /50 대체값조차 Tailwind 기본 색(oklch)으로 풀린다
    const out = squash(css);
    const shadowed = keys.color.filter((k) => themeVars.has(`--color-${k}`));
    expect(shadowed.length, `테마와 이름이 같은 색 토큰 (${version})`).toBeGreaterThan(0);
    for (const k of shadowed) {
      expect(out, `${k} (${version})`).toMatch(new RegExp(`\\.bg-ds-${k}\\\\/50 \\{ background-color: color-mix\\(in srgb, oklch\\(`));
    }
    // 같은 이름의 text/radius 토큰이 있으면 그것도 겹친다
    for (const k of keys.text) if (themeVars.has(`--text-${k}`)) expect(overlap, `--text-${k}`).toContain(`--text-${k}`);
    for (const k of keys.radius) if (themeVars.has(`--radius-${k}`)) expect(overlap, `--radius-${k}`).toContain(`--radius-${k}`);
  });
});

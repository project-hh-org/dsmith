import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { readComponentProps, validateEdit } from "@dsmith-dev/core";
import { describe, expect, it } from "vitest";
import { isSelfContainedType, renderScaffold } from "../src/scaffold.js";

describe("isSelfContainedType", () => {
  it.each([
    ['"a" | "b"', true],
    ["string", true],
    ["number | undefined", true],
    ["() => void", true],
    ["1 | 2 | 'x|y'", true],
    ["ReactNode", false],
    ["string[]", false],
    ["React.ReactNode | string", false],
    ["(e: Event) => void", false],
    ["", false],
  ])("%s → %s", (type, expected) => {
    expect(isSelfContainedType(type)).toBe(expected);
  });
});

describe("renderScaffold", () => {
  it("스냅샷: 결정 기준, 타입별 주석, 식별자가 아닌 prop 이름", () => {
    expect(
      renderScaffold({
        name: "Button",
        item: "Button",
        basis: "decided",
        from: "src/components/Button",
        props: [
          { name: "onClick" },
          { name: "children", type: "ReactNode" },
          { name: "variant", type: '"primary" | "secondary" | "danger"' },
          { name: "aria-label", type: "string", required: true },
        ],
        topUses: [
          { file: "app/page.tsx", count: 4 },
          { file: "app/orders/page.tsx", count: 2 },
        ],
        tokensRef: "design-system/tokens.css",
      }),
    ).toMatchInlineSnapshot(`
      "// dsmith init 스캐폴드 — Button (결정: src/components/Button)
      // 원 사용처 상위 2: app/page.tsx (4회), app/orders/page.tsx (2회)
      // TODO: 원 구현을 옮기고 하드코딩 값 대신 design-system/tokens.css 변수를 쓰세요. 고치기 전에는 결정이 바뀌면 dsmith가 다시 만들고, 고친 뒤에는 덮어쓰지 않습니다.

      export interface ButtonProps {
        "aria-label": string;
        children?: React.ReactNode;
        onClick?: unknown; // TODO: 타입 확인 (사용처에서만 관측)
        variant?: "primary" | "secondary" | "danger";
      }

      export function Button(_props: ButtonProps) {
        // TODO: 구현 — 받을 props는 ButtonProps 참고
        return null;
      }
      "
    `);
  });

  it("스캐폴드는 항상 `_props: XProps`를 받고 readComponentProps가 읽는다(식별자가 아닌 이름·예약어 포함)", () => {
    const text = renderScaffold({
      name: "Badge",
      item: "Badge",
      basis: "decided",
      from: "src/Badge",
      props: [{ name: "tone", type: '"a" | "b"' }, { name: "data-x" }, { name: "default" }, { name: "children", type: "ReactNode" }],
      topUses: [],
      tokensRef: "ds/tokens.css",
    });
    const read = readComponentProps(text, "design-system/components/Badge.tsx", "Badge");
    expect(read?.props.map((p) => p.name).sort()).toEqual(["children", "data-x", "default", "tone"]);
    expect(validateEdit("Badge.tsx", "", text)).toEqual({ ok: true });
    expect(text).toContain("export function Badge(_props: BadgeProps) {");
  });

  it("생성된 스캐폴드가 tsc --strict --noUnusedParameters --noUnusedLocals로 컴파일된다", () => {
    const dir = mkdtempSync(join(tmpdir(), "dsmith-scaffold-"));
    try {
      const props = [{ name: "tone", type: '"a" | "b"' }, { name: "data-x" }, { name: "default" }, { name: "children", type: "ReactNode" }];
      writeFileSync(join(dir, "Badge.tsx"), renderScaffold({ name: "Badge", item: "Badge", basis: "decided", from: "x", props, topUses: [], tokensRef: "t.css" }));
      writeFileSync(join(dir, "Card.tsx"), renderScaffold({ name: "Card", item: "Card", basis: "decided", from: "x", props: [], topUses: [], tokensRef: "t.css" }));
      // 모노레포에 @types/react가 없어 React 전역 네임스페이스만 최소로 선언한다
      writeFileSync(join(dir, "react-stub.d.ts"), "declare namespace React { type ReactNode = string | number | boolean | null | undefined; }\n");
      const tsc = join(dirname(createRequire(import.meta.url).resolve("typescript/package.json")), "bin", "tsc");
      const run = spawnSync(
        process.execPath,
        [tsc, "--noEmit", "--strict", "--noUnusedParameters", "--noUnusedLocals", "--jsx", "react-jsx", "--skipLibCheck", "--target", "es2022", "--module", "esnext", "--moduleResolution", "bundler", "Badge.tsx", "Card.tsx", "react-stub.d.ts"],
        { cwd: dir, encoding: "utf8" },
      );
      expect(run.stdout + run.stderr).toBe("");
      expect(run.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("props가 없어도 매개변수에 타입을 달아 읽을 수 있다", () => {
    const text = renderScaffold({ name: "Card", item: "Card", basis: "decided", from: "x", props: [], topUses: [], tokensRef: "t.css" });
    expect(text).toContain("export function Card(_props: CardProps) {");
    expect(readComponentProps(text, "Card.tsx", "Card")).toEqual({ props: [], inherits: [] });
  });

  it("추천 기준 첫 줄, props 없음", () => {
    const text = renderScaffold({
      name: "Card",
      item: "Card",
      basis: "recommended",
      from: "src/Card.tsx",
      props: [],
      topUses: [],
      tokensRef: "ds/tokens.css",
    });
    expect(text.split("\n")[0]).toBe("// dsmith init 스캐폴드 — Card (추천: src/Card.tsx, 결정 전)");
    expect(text).toContain("export interface CardProps {}");
  });
});

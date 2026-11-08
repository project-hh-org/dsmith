import { applyPatches } from "@dsmith-dev/core";
import { describe, expect, it } from "vitest";
import { planNamedImport, planNamedImports, type ImportPlan } from "../src/imports.js";

const mc = { baseUrlEntries: new Set<string>(), dependencies: new Set<string>(["react-native"]) };
const need = { module: "src/theme", name: "colors", isPath: true } as const;

function plan(code: string, file = "src/screens/Home.tsx", tsPaths: Parameters<typeof planNamedImport>[0]["tsPaths"] = null, n = need): ImportPlan {
  return planNamedImport({ file, code, tsPaths, moduleContext: mc }, n);
}

function applied(code: string, p: ImportPlan): string {
  if (p.kind !== "add") throw new Error(`add가 아님: ${p.kind}`);
  return applyPatches(code, [p.patch]);
}

describe("planNamedImport", () => {
  it("같은 module의 named 선언에 합친다(따옴표·세미콜론 보존)", () => {
    const code = `import { spacing } from '../theme'\nimport React from 'react'\n\nexport const A = () => null\n`;
    const p = plan(code, "src/screens/Home.tsx", null, { ...need, name: "colors" });
    expect(p.kind).toBe("add");
    expect(applied(code, p)).toBe(`import { spacing, colors } from '../theme'\nimport React from 'react'\n\nexport const A = () => null\n`);
    if (p.kind === "add") expect(p.local).toBe("colors");
  });

  it("module이 없으면 마지막 import 뒤에 새 줄(기존 import의 따옴표·세미콜론을 따름)", () => {
    const code = `import React from 'react';\nimport { View } from 'react-native';\n\nexport const A = () => <View />;\n`;
    const p = plan(code);
    expect(applied(code, p)).toBe(
      `import React from 'react';\nimport { View } from 'react-native';\nimport { colors } from '../theme';\n\nexport const A = () => <View />;\n`,
    );
  });

  it("CRLF 파일은 CRLF로 줄을 더한다", () => {
    const code = `import React from "react"\r\n\r\nexport const A = 1\r\n`;
    expect(applied(code, plan(code))).toBe(`import React from "react"\r\nimport { colors } from "../theme"\r\n\r\nexport const A = 1\r\n`);
  });

  it("import가 없으면 파일 맨 앞(지시문 뒤)에 더한다", () => {
    const code = `export const A = 1\n`;
    expect(applied(code, plan(code))).toBe(`import { colors } from "../theme";\nexport const A = 1\n`);
    const withDirective = `"use client";\nexport const A = 1\n`;
    expect(applied(withDirective, plan(withDirective))).toBe(`"use client";\nimport { colors } from "../theme";\nexport const A = 1\n`);
  });

  it("이미 값 import가 있으면 present(별칭 포함)", () => {
    expect(plan(`import { colors } from "../theme"\n`)).toEqual({ kind: "present", local: "colors" });
    expect(plan(`import { spacing, colors as c } from "../theme"\n`)).toEqual({ kind: "present", local: "c" });
  });

  it("import type { colors }는 값이 아니므로 그 import를 값 import로 바꾼다(중복 선언을 만들지 않는다)", () => {
    const code = `import type { colors } from "../theme"\nexport const A = 1\n`;
    expect(applied(code, plan(code))).toBe(`import { colors } from "../theme"\nexport const A = 1\n`);
    // 선언에 다른 지정자가 있으면 그것들만 타입 전용으로 남긴다
    const multi = `import type { colors, Theme } from '../theme';\n`;
    expect(applied(multi, plan(multi))).toBe(`import { colors, type Theme } from '../theme';\n`);
    // 인라인 type 지정자는 그 키워드만 뗀다
    const inline = `import { type colors, spacing } from "../theme"\n`;
    expect(applied(inline, plan(inline))).toBe(`import { colors, spacing } from "../theme"\n`);
  });

  it("같은 선언의 이름 두 개를 모두 값으로 쓰면 선언을 한 번만 바꾼다", () => {
    const code = `import type { colors, spacing, Theme } from "../theme"\nexport const A = 1\n`;
    const r = planNamedImports({ file: "src/screens/Home.tsx", code, tsPaths: null, moduleContext: mc }, [need, { ...need, name: "spacing" }]);
    expect(applyPatches(code, r.patches)).toBe(`import { colors, spacing, type Theme } from "../theme"\nexport const A = 1\n`);
  });

  it("같은 로컬 이름의 다른 바인딩이 있으면 conflict", () => {
    expect(plan(`import { colors } from "./other"\n`).kind).toBe("conflict");
    expect(plan(`const colors = { a: 1 }\nexport const A = colors\n`).kind).toBe("conflict");
    expect(plan(`export function A({ colors }: { colors: string }) { return colors }\n`).kind).toBe("conflict");
  });

  it("namespace import가 있으면 t.colors를 로컬 식으로 쓴다", () => {
    expect(plan(`import * as t from "../theme"\n`)).toEqual({ kind: "present", local: "t.colors" });
  });

  it("tsconfig 별칭이 상대 경로보다 우선", () => {
    const code = `import React from "react"\n`;
    const tsPaths = { baseUrl: "", paths: { "@/*": ["./src/*"] }, baseUrlExplicit: false };
    expect(applied(code, plan(code, "src/screens/Home.tsx", tsPaths))).toBe(`import React from "react"\nimport { colors } from "@/theme"\n`);
  });

  it("default export는 default import로 더한다", () => {
    const code = `import React from "react"\n`;
    const p = plan(code, "src/screens/Home.tsx", null, { module: "src/theme", name: "default", isPath: true });
    expect(p.kind).toBe("add");
    expect(applied(code, p)).toBe(`import React from "react"\nimport theme from "../theme"\n`);
    if (p.kind === "add") expect(p.local).toBe("theme");
  });

  it("파싱하지 못하는 코드는 conflict", () => {
    expect(plan(`const = ;`).kind).toBe("conflict");
  });
});

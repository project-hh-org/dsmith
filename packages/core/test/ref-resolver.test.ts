import type { StyleUsage } from "@dsmith-dev/extractor-api";
import { describe, expect, it } from "vitest";
import { importTableOf, memberRefOf } from "../src/parse/member-ref.js";
import { parseTsx } from "../src/parse/tsx.js";
import { readJsThemeTokens } from "../src/tokens/js-theme.js";
import { buildTokenRefResolver, replacementCandidates } from "../src/tokens/ref-resolver.js";
import type { Token } from "../src/model/token.js";

const THEME = `
export const colors = { surface: "#ffffff", mode: { a: "#000" } } as const;
export const spacing = { 2: 8, sm: 4 } as const;
export const typography = { caption: { fontSize: 12, fontWeight: "600" as const }, bare: { fontWeight: "700" as const } };
export default { primary: "#3b82f6" };
`;
const tokens: Token[] = readJsThemeTokens(THEME, "src/theme.ts", { module: "src/theme" }).tokens;

const OTHER = readJsThemeTokens(`export const colors = { surface: "#ffffff" };`, "src/other.ts", { module: "src/other" }).tokens;

function usageOf(file: string, code: string, raw: string, extra: Partial<StyleUsage> = {}): StyleUsage {
  const ref = memberRefOf(raw, importTableOf(parseTsx(code, file)));
  return {
    file,
    line: 1,
    column: 0,
    property: "color",
    raw,
    normalized: { kind: "unknown" },
    source: "dynamic",
    extractor: "test",
    ...(ref === undefined ? {} : { ref }),
    ...extra,
  };
}

const env = { tsPaths: null, moduleContext: {} };

describe("memberRefOf / importTableOf", () => {
  const code = `import { colors as c, spacing } from "../theme";\nimport * as t from "@/theme";\nimport theme from "./theme";\nimport type { Foo } from "./foo";`;
  const table = importTableOf(parseTsx(code, "src/a/b.tsx"));

  it("named·alias·namespace·default 바인딩에서 시작하는 멤버 식", () => {
    expect(memberRefOf("c.surface", table)).toEqual({ specifier: "../theme", imported: "colors", path: ["surface"] });
    expect(memberRefOf("spacing[2]", table)).toEqual({ specifier: "../theme", imported: "spacing", path: ["2"] });
    expect(memberRefOf("t.colors.surface", table)).toEqual({ specifier: "@/theme", imported: "*", path: ["colors", "surface"] });
    expect(memberRefOf("theme.primary", table)).toEqual({ specifier: "./theme", imported: "default", path: ["primary"] });
    expect(memberRefOf(`c["a-b"]`, table)?.path).toEqual(["a-b"]);
  });

  it("계산 접근·호출·옵셔널·import 아닌 루트·타입 import는 ref 없음", () => {
    expect(memberRefOf("c.mode[x]", table)).toBeUndefined();
    expect(memberRefOf("c.surface()", table)).toBeUndefined();
    expect(memberRefOf("c?.surface", table)).toBeUndefined();
    expect(memberRefOf("local.surface", table)).toBeUndefined();
    expect(memberRefOf("Foo.a", table)).toBeUndefined();
    expect(memberRefOf("c", table)).toBeUndefined();
  });
});

describe("buildTokenRefResolver", () => {
  const resolve = buildTokenRefResolver([...tokens, ...OTHER], env);

  it("named import를 상대 경로로 해석한다", () => {
    const code = `import { colors } from "../theme";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", code, "colors.surface"))?.name).toBe("colors.surface");
  });

  it("alias import도 원래 export 이름으로 푼다", () => {
    const code = `import { colors as c } from "../theme";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", code, "c.surface"))?.name).toBe("colors.surface");
  });

  it("namespace import: t.colors.surface", () => {
    const code = `import * as t from "../theme";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", code, "t.colors.surface"))?.name).toBe("colors.surface");
  });

  it("default import는 export default 객체의 토큰", () => {
    const code = `import theme from "../theme";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", code, "theme.primary"))?.name).toBe("default.primary");
  });

  it("숫자 인덱스 spacing[2]", () => {
    const code = `import { spacing } from "../theme";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", code, "spacing[2]"))?.name).toBe("spacing.2");
  });

  it("tsconfig paths 별칭", () => {
    const aliased = buildTokenRefResolver(tokens, {
      tsPaths: { baseUrl: "", baseUrlExplicit: true, paths: { "@app/*": ["src/*"] } },
      moduleContext: {},
    });
    const code = `import { colors } from "@app/theme";`;
    expect(aliased("app/index.tsx", usageOf("app/index.tsx", code, "colors.surface"))?.name).toBe("colors.surface");
  });

  it("@/ 별칭은 src/ 아래 파일 기준으로 푼다", () => {
    const code = `import { colors } from "@/theme";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", code, "colors.surface"))?.name).toBe("colors.surface");
  });

  it("다른 module의 같은 이름은 그 module 토큰으로 해석되고, 없는 module이면 미해석", () => {
    const other = `import { colors } from "../other";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", other, "colors.surface"))?.js?.module).toBe("src/other");
    const missing = `import { colors } from "../missing";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", missing, "colors.surface"))).toBeNull();
  });

  it("계산 접근은 ref가 없어 미해석, 없는 경로도 미해석", () => {
    const code = `import { colors } from "../theme";`;
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", code, "colors.mode[x]"))).toBeNull();
    expect(resolve("src/screens/A.tsx", usageOf("src/screens/A.tsx", code, "colors.nope"))).toBeNull();
  });

  it("스프레드는 fontSize 토큰이 있을 때만 해석된다", () => {
    const code = `import { typography } from "../theme";`;
    const withSize = usageOf("src/screens/A.tsx", code, "typography.caption", { property: "other" });
    withSize.ref = { ...withSize.ref!, spread: true };
    expect(resolve("src/screens/A.tsx", withSize)?.name).toBe("typography.caption.fontSize");
    const without = usageOf("src/screens/A.tsx", code, "typography.bare", { property: "other" });
    without.ref = { ...without.ref!, spread: true };
    expect(resolve("src/screens/A.tsx", without)).toBeNull();
  });

  it("JS 토큰이 없으면 항상 null", () => {
    const none = buildTokenRefResolver([], env);
    const code = `import { colors } from "../theme";`;
    expect(none("src/a.tsx", usageOf("src/a.tsx", code, "colors.surface"))).toBeNull();
  });
});

describe("replacementCandidates", () => {
  const css: Token = { name: "--c", value: "#fff", normalized: { kind: "unknown" }, category: "color" };
  const js = tokens.filter((t) => t.js?.mode === undefined);
  const modeToken: Token = { ...js[0]!, name: "Colors.light.bg", js: { module: "src/theme", export: "Colors", path: ["light", "bg"], mode: "light" } };

  it("웹 + CSS 토큰 있음 → JS 제외", () => {
    expect(replacementCandidates([css, ...js], { framework: "next" })).toEqual([css]);
  });

  it("웹 + JS뿐 → 포함", () => {
    expect(replacementCandidates(js, { framework: "next" })).toEqual(js);
  });

  it("RN → 포함", () => {
    expect(replacementCandidates([css, ...js], { framework: "react-native" })).toEqual([css, ...js]);
  });

  it("mode 토큰은 항상 제외", () => {
    expect(replacementCandidates([...js, modeToken], { framework: "react-native" })).toEqual(js);
    expect(replacementCandidates([modeToken], { framework: "next" })).toEqual([]);
  });
});

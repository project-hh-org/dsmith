import { describe, expect, it } from "vitest";
import { jsTokenExpression, type TokenLike } from "../src/index.js";

const token = (js: TokenLike["js"]): TokenLike => ({
  name: "n",
  value: "v",
  category: "color",
  normalized: { kind: "unknown" },
  ...(js === undefined ? {} : { js }),
});

describe("jsTokenExpression", () => {
  it("식별자 키는 점 접근", () => {
    expect(jsTokenExpression(token({ module: "src/theme", export: "colors", path: ["surface"] }))).toBe("colors.surface");
    expect(jsTokenExpression(token({ module: "src/theme", export: "typography", path: ["caption", "fontSize"] }))).toBe(
      "typography.caption.fontSize",
    );
  });

  it("숫자 키는 인덱스, 식별자가 아닌 키는 문자열 인덱스", () => {
    expect(jsTokenExpression(token({ module: "m", export: "colors", path: ["brand", "500"] }))).toBe("colors.brand[500]");
    expect(jsTokenExpression(token({ module: "m", export: "spacing", path: ["2"] }))).toBe("spacing[2]");
    expect(jsTokenExpression(token({ module: "m", export: "colors", path: ["a-b"] }))).toBe('colors["a-b"]');
    expect(jsTokenExpression(token({ module: "m", export: "colors", path: ["01"] }))).toBe('colors["01"]');
  });

  it("local 이름이 export 이름을 대신한다", () => {
    expect(jsTokenExpression(token({ module: "m", export: "colors", path: ["surface"] }), "c")).toBe("c.surface");
  });

  it("token.js가 없으면 null", () => {
    expect(jsTokenExpression(token(undefined))).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import type { StyleSource, StyleUsage } from "@dsmith-dev/extractor-api";
import { clusterColors } from "../src/cluster/color-cluster.js";
import type { NormalizedColor } from "../src/model/style-usage.js";
import { colorDistance } from "../src/match/distance.js";
import { normalizeColor } from "../src/normalize/color.js";

function colorUsage(hex: string, source: StyleSource = "hardcoded"): StyleUsage {
  const normalized = normalizeColor(hex);
  if (normalized === null) throw new Error(`invalid color: ${hex}`);
  return {
    file: "a.tsx",
    line: 1,
    column: 1,
    property: "color",
    raw: hex,
    normalized,
    source,
    extractor: "test",
  };
}

function repeat(hex: string, n: number, source: StyleSource = "hardcoded"): StyleUsage[] {
  return Array.from({ length: n }, () => colorUsage(hex, source));
}

function norm(hex: string) {
  const n = normalizeColor(hex);
  if (n === null) throw new Error(`invalid color: ${hex}`);
  return n;
}

describe("colorDistance", () => {
  it("같은 색의 거리는 0이다", () => {
    expect(colorDistance(norm("#3B82F6"), norm("#3b82f6"))).toBe(0);
  });

  it("흰색과 검정의 거리는 명도 차(1)와 같다", () => {
    expect(colorDistance(norm("#ffffff"), norm("#000000"))).toBeCloseTo(1, 2);
  });

  it("거의 같은 파랑은 작은 거리, 파랑과 빨강은 큰 거리를 가진다", () => {
    expect(colorDistance(norm("#3B82F6"), norm("#3C83F7"))).toBeLessThan(0.01);
    expect(colorDistance(norm("#3B82F6"), norm("#EF4444"))).toBeGreaterThan(0.2);
  });

  it("hue가 0/360 경계를 넘어도 가까운 색은 가깝다", () => {
    const at = (h: number): NormalizedColor => ({ kind: "color", hex: "#000000", l: 0.6, c: 0.15, h });
    const wrapped = colorDistance(at(359), at(1));
    expect(wrapped).toBeLessThan(0.03);
    expect(wrapped).toBeLessThan(colorDistance(at(1), at(20)));
  });

  it("교환법칙이 성립한다", () => {
    const a = norm("#3B82F6");
    const b = norm("#EF4444");
    expect(colorDistance(a, b)).toBe(colorDistance(b, a));
  });
});

describe("clusterColors", () => {
  it("가까운 색을 빈도순 greedy로 묶는다", () => {
    const usages = [...repeat("#3B82F6", 5), ...repeat("#3C83F7", 2), ...repeat("#EF4444", 1)];
    const clusters = clusterColors(usages);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]?.total).toBe(7);
    expect(clusters[0]?.members).toEqual([
      { hex: "#3b82f6", count: 5 },
      { hex: "#3c83f7", count: 2 },
    ]);
    expect(clusters[0]?.representative.hex).toBe("#3b82f6");
    expect(clusters[1]?.total).toBe(1);
    expect(clusters[1]?.representative.hex).toBe("#ef4444");
  });

  it("클러스터는 total 내림차순으로 정렬한다", () => {
    const usages = [...repeat("#EF4444", 1), ...repeat("#3B82F6", 3)];
    const clusters = clusterColors(usages);
    expect(clusters.map((c) => c.representative.hex)).toEqual(["#3b82f6", "#ef4444"]);
  });

  it("hardcoded가 아닌 출처와 색이 아닌 값은 제외한다", () => {
    const usages = [
      ...repeat("#3B82F6", 1, "tailwind-default"),
      ...repeat("#EF4444", 1, "token"),
      ...repeat("#22C55E", 1, "dynamic"),
      {
        ...colorUsage("#000000"),
        normalized: { kind: "length", px: 4 } as const,
      },
    ];
    expect(clusterColors(usages)).toEqual([]);
  });

  it("threshold를 조정하면 묶임이 달라진다", () => {
    const usages = [...repeat("#3B82F6", 2), ...repeat("#3C83F7", 1)];
    expect(clusterColors(usages, { threshold: 0.0001 })).toHaveLength(2);
    expect(clusterColors(usages, { threshold: 0.03 })).toHaveLength(1);
  });

  it("빈도가 같으면 hex 오름차순으로 대표를 정한다", () => {
    const usages = [...repeat("#3C83F7", 1), ...repeat("#3B82F6", 1)];
    const clusters = clusterColors(usages);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.representative.hex).toBe("#3b82f6");
  });

  it("suggestedName은 hue 구간명과 명도 단계로 만든다", () => {
    const names = (hex: string) => clusterColors(repeat(hex, 1))[0]?.suggestedName;
    expect(names("#3B82F6")).toBe("blue-400");
    expect(names("#EF4444")).toBe("red-400");
    expect(names("#22C55E")).toBe("green-300");
    expect(names("#ffffff")).toBe("gray-50");
    expect(names("#000000")).toBe("gray-950");
    expect(names("#808080")).toBe("gray-500");
  });
});

describe("clusterColors hue 구간", () => {
  const nameOf = (css: string) => clusterColors(repeat(css, 1))[0]?.suggestedName.split("-")[0];

  it("oklch hue 구간에 따라 색 이름을 붙인다", () => {
    expect(nameOf("oklch(0.6 0.15 30)")).toBe("red");
    expect(nameOf("oklch(0.6 0.15 55)")).toBe("orange");
    expect(nameOf("oklch(0.6 0.15 90)")).toBe("yellow");
    expect(nameOf("oklch(0.6 0.15 115)")).toBe("lime");
    expect(nameOf("oklch(0.6 0.15 145)")).toBe("green");
    expect(nameOf("oklch(0.6 0.15 175)")).toBe("teal");
    expect(nameOf("oklch(0.6 0.15 205)")).toBe("cyan");
    expect(nameOf("oklch(0.6 0.15 235)")).toBe("sky");
    expect(nameOf("oklch(0.6 0.15 265)")).toBe("blue");
    expect(nameOf("oklch(0.6 0.15 295)")).toBe("indigo");
    expect(nameOf("oklch(0.6 0.15 325)")).toBe("purple");
    expect(nameOf("oklch(0.6 0.15 355)")).toBe("pink");
  });

  it("채도가 낮으면 hue와 무관하게 gray다", () => {
    expect(nameOf("oklch(0.6 0.02 265)")).toBe("gray");
  });
});

describe("clusterColors hue 구간 경계", () => {
  function nameAt(h: number, c = 0.15): string | undefined {
    const usage: StyleUsage = {
      ...colorUsage("#000000"),
      normalized: { kind: "color", hex: "#123456", l: 0.6, c, h },
    };
    return clusterColors([usage])[0]?.suggestedName.split("-")[0];
  }

  it("구간 경계에서 올바른 이름을 고른다", () => {
    expect(nameAt(0)).toBe("pink");
    expect(nameAt(9.9)).toBe("pink");
    expect(nameAt(10)).toBe("red");
    expect(nameAt(39.9)).toBe("red");
    expect(nameAt(40)).toBe("orange");
    expect(nameAt(359.9)).toBe("pink");
  });

  it("중간 밝기에서는 채도 0.045 미만이 gray, 이상이 hue 이름이다", () => {
    expect(nameAt(260, 0.0449)).toBe("gray");
    expect(nameAt(260, 0.045)).toBe("blue");
  });
});

describe("clusterColors gray 판정은 밝기에 따라 달라진다", () => {
  const family = (hex: string) => clusterColors(repeat(hex, 1))[0]?.suggestedName.split("-")[0];
  const TAILWIND = {
    gray: ["#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151", "#1f2937", "#111827", "#030712"],
    slate: ["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a", "#020617"],
    stone: ["#fafaf9", "#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e", "#44403c", "#292524", "#1c1917", "#0c0a09"],
    zinc: ["#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b"],
    neutral: ["#fafafa", "#f5f5f5", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373", "#525252", "#404040", "#262626", "#171717", "#0a0a0a"],
  };

  for (const [name, hexes] of Object.entries(TAILWIND)) {
    it(`Tailwind ${name} 50–950은 모두 gray 계열이다`, () => {
      for (const hex of hexes) expect(family(hex), `${name} ${hex}`).toBe("gray");
    });
  }

  it("연한 색조(50)는 자기 hue를 유지한다", () => {
    expect(family("#eff6ff")).toBe("blue"); // blue-50
    expect(family("#f0f9ff")).toBe("sky"); // sky-50
    expect(family("#eef2ff")).toBe("blue"); // indigo-50 (hue 구간상 blue)
    expect(family("#fff1f2")).toBe("red"); // rose-50
    expect(family("#f0fdfa")).toBe("teal"); // teal-50
    expect(family("#f5f3ff")).not.toBe("gray"); // violet-50
    expect(family("#fffbeb")).not.toBe("gray"); // amber-50
  });

  it("#374151·#111827은 gray, #eff6ff는 blue", () => {
    expect(family("#374151")).toBe("gray");
    expect(family("#111827")).toBe("gray");
    expect(family("#eff6ff")).toBe("blue");
  });
});

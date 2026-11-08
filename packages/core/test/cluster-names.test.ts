import { describe, expect, it } from "vitest";
import { clusterColors } from "../src/cluster/color-cluster.js";
import { colorTokenNames, uniqueNames } from "../src/cluster/names.js";
import { normalizeColor } from "../src/normalize/color.js";
import { proposalTokens } from "../src/tokens/proposal.js";
import { localDate } from "../src/util/local-date.js";
import type { StyleUsage } from "@dsmith-dev/extractor-api";

describe("uniqueNames", () => {
  it("첫 등장은 그대로, 중복은 -2, -3 …", () => {
    expect(uniqueNames(["a", "b", "a", "a"])).toEqual(["a", "b", "a-2", "a-3"]);
  });

  it("이미 쓰인 이름은 건너뛴다", () => {
    expect(uniqueNames(["a", "a-2", "a"])).toEqual(["a", "a-2", "a-3"]);
  });
});

describe("colorTokenNames", () => {
  it("proposalTokens의 색 이름과 같다", () => {
    const hexes = ["#808080", "#7f7f7f", "#6e6e6e", "#3b82f6"];
    const usages: StyleUsage[] = hexes.map((hex, i) => {
      const n = parseInt(hex.slice(1, 3), 16) / 255;
      return {
        file: "a.tsx",
        line: i + 1,
        column: 1,
        property: "color",
        raw: hex,
        normalized: { kind: "color", hex, l: n, c: hex === "#3b82f6" ? 0.2 : 0, h: 260 },
        source: "hardcoded",
        extractor: "test",
      };
    });
    const clusters = clusterColors(usages);
    expect(colorTokenNames(clusters)).toEqual(
      proposalTokens(usages)
        .filter((t) => t.category === "color")
        .map((t) => t.name),
    );
  });
});

describe("localDate", () => {
  it("로컬 시간대 YYYY-MM-DD", () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

function usagesOf(hexes: string[], counts: number[] = []): StyleUsage[] {
  return hexes.flatMap((hex, i) => {
    const normalized = normalizeColor(hex);
    if (normalized === null) throw new Error(hex);
    return Array.from({ length: counts[i] ?? 1 }, (_, k) => ({
      file: "a.tsx",
      line: i * 100 + k + 1,
      column: 1,
      property: "color" as const,
      raw: hex,
      normalized,
      source: "hardcoded" as const,
      extractor: "test",
    }));
  });
}

/** hex → 이름 */
function nameByHex(hexes: string[], counts: number[] = []): Record<string, string> {
  const clusters = clusterColors(usagesOf(hexes, counts));
  const names = colorTokenNames(clusters);
  return Object.fromEntries(clusters.map((c, i) => [c.representative.hex, names[i] as string]));
}

const stepOf = (name: string): number => Number(/-(\d+)$/.exec(name)?.[1]);

describe("colorTokenNames: 밝기 순서를 따른다", () => {
  it("순백·순흑은 white·black이고 gray 단계를 차지하지 않는다", () => {
    const names = nameByHex(["#ffffff", "#000000", "#f3f4f6", "#6b7280"], [9, 5, 3, 2]);
    expect(names["#ffffff"]).toBe("white");
    expect(names["#000000"]).toBe("black");
    expect(names["#f3f4f6"]).toBe("gray-50");
    expect(names["#6b7280"]).toBe("gray-500");
  });

  it("같은 계열에서 비슷한 밝기는 -N 접미사 없이 가까운 빈 단계로 가고, 밝을수록 번호가 작다", () => {
    const hexes = ["#f9fafb", "#f3f4f6", "#eeeff1", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#444444", "#1f1f1f"];
    const names = nameByHex(hexes, [1, 9, 2, 5, 4, 3, 7, 6, 8]);
    for (const n of Object.values(names)) expect(n, n).toMatch(/^gray-\d+$/);
    expect(new Set(Object.values(names)).size).toBe(Object.keys(names).length);
    expect(Object.keys(names).length).toBeGreaterThanOrEqual(6); // 가까운 색은 클러스터로 묶인다
    const byLightness = Object.entries(names)
      .map(([hex, name]) => ({ l: normalizeColor(hex) as unknown as { l: number }, name }))
      .sort((a, b) => b.l.l - a.l.l)
      .map((x) => stepOf(x.name));
    expect(byLightness).toEqual([...byLightness].sort((a, b) => a - b));
    // 가장 밝은 쪽이 최대 사용 수가 아니어도 50, 가장 어두운 쪽이 950 쪽이다
    expect(byLightness[0]).toBe(50);
    expect(stepOf(names["#1f1f1f"] as string)).toBeGreaterThanOrEqual(800);
  });

  it("빨강 계열 여러 단계도 접미사 없이 밝기 순이다", () => {
    const hexes = ["#ef4444", "#f87171", "#dc2626", "#fca5a5", "#fecaca"];
    const names = nameByHex(hexes, [1, 2, 3, 4, 5]);
    for (const n of Object.values(names)) expect(n, n).toMatch(/^red-\d+$/);
    expect(stepOf(names["#fecaca"] as string)).toBeLessThan(stepOf(names["#fca5a5"] as string));
    expect(stepOf(names["#fca5a5"] as string)).toBeLessThan(stepOf(names["#f87171"] as string));
    expect(stepOf(names["#f87171"] as string)).toBeLessThan(stepOf(names["#ef4444"] as string));
    expect(stepOf(names["#ef4444"] as string)).toBeLessThan(stepOf(names["#dc2626"] as string));
  });

  it("입력 순서·사용 수와 무관하게 결정적이다(같은 입력 → 같은 이름)", () => {
    const hexes = ["#f9fafb", "#f3f4f6", "#e5e7eb", "#9ca3af", "#6b7280", "#111827"];
    const a = nameByHex(hexes, [1, 2, 3, 4, 5, 6]);
    expect(nameByHex([...hexes].reverse(), [6, 5, 4, 3, 2, 1])).toEqual(a);
    expect(nameByHex(hexes, [1, 2, 3, 4, 5, 6])).toEqual(a);
  });

  it("한 계열이 11단계를 넘을 때만 접미사로 돌아간다", () => {
    const grays = Array.from({ length: 13 }, (_, i) => {
      const v = Math.round(250 - i * 18);
      return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
    });
    const names = Object.values(nameByHex(grays));
    expect(new Set(names).size).toBe(13);
    expect(names.filter((n) => /^gray-\d+$/.test(n))).toHaveLength(11);
    expect(names.filter((n) => /^gray-\d+-\d+$/.test(n))).toHaveLength(2);
  });
});

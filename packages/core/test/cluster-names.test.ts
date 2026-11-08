import { describe, expect, it } from "vitest";
import { clusterColors, type ColorCluster } from "../src/cluster/color-cluster.js";
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

/** 클러스터링 없이 hex마다 클러스터 하나(가까운 색이 합쳐지지 않게) */
function rawClusters(hexes: string[], counts: number[] = []): ColorCluster[] {
  return hexes.map((hex, i) => {
    const representative = normalizeColor(hex);
    if (representative === null) throw new Error(hex);
    const total = counts[i] ?? 1;
    return { representative, members: [{ hex: representative.hex, count: total }], total, suggestedName: "" };
  });
}

function rawNames(hexes: string[], counts: number[] = []): Record<string, string> {
  const clusters = rawClusters(hexes, counts);
  const names = colorTokenNames(clusters);
  return Object.fromEntries(clusters.map((c, i) => [c.representative.hex, names[i] as string]));
}

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

  it("한 계열이 39개(25…975 사다리)를 넘을 때만 접미사로 돌아간다", () => {
    const greyAt = (i: number, n: number): string => {
      const v = Math.round(250 - (i * 240) / (n - 1));
      return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
    };
    const exactly39 = Array.from({ length: 39 }, (_, i) => greyAt(i, 39));
    const n39 = Object.values(rawNames(exactly39));
    expect(n39).toHaveLength(39);
    for (const n of n39) expect(n, n).toMatch(/^gray-\d+$/);
    expect(new Set(n39).size).toBe(39);

    const over = Array.from({ length: 42 }, (_, i) => greyAt(i, 42));
    const names = Object.values(rawNames(over));
    expect(names).toHaveLength(42);
    expect(new Set(names).size).toBe(names.length);
    expect(names.filter((n) => /^gray-\d+-\d+$/.test(n)).length).toBeGreaterThan(0);
  });

  it("리뷰 프로브: 회색 15개에서 #e6e6e6이 #aaaaaa보다 작은 단계이고 접미사가 없다", () => {
    const hexes = Array.from({ length: 15 }, (_, i) => {
      const v = (20 + i * 15).toString(16).padStart(2, "0");
      return `#${v}${v}${v}`;
    });
    expect(hexes).toContain("#e6e6e6");
    expect(hexes).toContain("#aaaaaa");
    // 어두운 쪽이 더 많이 쓰인다
    const names = rawNames(hexes, hexes.map((_, i) => 15 - i));
    expect(stepOf(names["#e6e6e6"] as string)).toBeLessThan(stepOf(names["#aaaaaa"] as string));
    for (const n of Object.values(names)) expect(n, n).toMatch(/^gray-\d+$/);
    expect(new Set(Object.values(names)).size).toBe(15);
  });

  it("Tailwind blue 11단계는 표준 단계 위주로 밝기 순서를 지킨다", () => {
    const blue = ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"];
    const names = rawNames(blue);
    const steps = blue.map((h) => stepOf(names[h] as string));
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(names["#eff6ff"]).toBe("blue-50");
  });

  it("속성: 무작위 색 집합에서 같은 계열 안은 밝을수록 작은 단계, 접미사 없음, 입력 순서 무관", () => {
    // 시드 고정 LCG
    let seed = 20261108;
    const rand = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    const hex2 = (v: number): string => Math.round(v).toString(16).padStart(2, "0");
    for (let round = 0; round < 40; round++) {
      const size = 1 + Math.floor(rand() * 39); // 어느 계열도 39개를 넘지 않는다
      const hexes = new Set<string>();
      while (hexes.size < size) {
        const grey = rand() < 0.5;
        if (grey) {
          const v = 5 + rand() * 245;
          hexes.add(`#${hex2(v)}${hex2(v)}${hex2(v)}`);
        } else {
          hexes.add(`#${hex2(rand() * 255)}${hex2(rand() * 255)}${hex2(rand() * 255)}`);
        }
      }
      const list = [...hexes].filter((h) => h !== "#ffffff" && h !== "#000000");
      const counts = list.map(() => 1 + Math.floor(rand() * 9));
      const clusters = rawClusters(list, counts);
      const names = colorTokenNames(clusters);
      const byFamily = new Map<string, { l: number; step: number; hex: string }[]>();
      clusters.forEach((c, i) => {
        const name = names[i] as string;
        const m = /^([a-z]+)-(\d+)(-\d+)?$/.exec(name);
        expect(m, name).not.toBeNull();
        const family = m?.[1] as string;
        expect(m?.[3], `${name}: 39개 이하면 접미사가 없어야 한다`).toBeUndefined();
        byFamily.set(family, [...(byFamily.get(family) ?? []), { l: c.representative.l, step: Number(m?.[2]), hex: c.representative.hex }]);
      });
      for (const [family, rows] of byFamily) {
        const sorted = [...rows].sort((a, b) => b.l - a.l || (a.hex < b.hex ? -1 : 1));
        for (let k = 1; k < sorted.length; k++) {
          expect(sorted[k]?.step, `${family} ${sorted[k - 1]?.hex} → ${sorted[k]?.hex}`).toBeGreaterThan(sorted[k - 1]?.step as number);
        }
      }
      // 입력 순서·사용 수와 무관
      const a = rawNames(list, counts);
      const b = rawNames([...list].reverse(), [...counts].reverse());
      expect(b).toEqual(a);
    }
  });
});

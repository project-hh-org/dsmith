import type { StyleUsage } from "@dsmith-dev/extractor-api";
import { colorDistance } from "../match/distance.js";
import type { NormalizedColor } from "../model/style-usage.js";

export interface ColorCluster {
  representative: NormalizedColor;
  members: { hex: string; count: number }[];
  total: number;
  suggestedName: string;
}

const DEFAULT_THRESHOLD = 0.03;

/**
 * gray 판정 채도 상한(밝기별). 어두운 slate(C≈.04)는 gray로, 아주 밝은 색조(blue-50, C≈.014)는 hue로 남기려고
 * 밝기에 따라 (l, 상한) 점을 잇는다.
 */
const ACHROMATIC_CHROMA_BY_LIGHTNESS: readonly (readonly [number, number])[] = [
  [0, 0.045],
  [0.8, 0.045],
  [0.93, 0.022],
  [0.99, 0.008],
  [1, 0.008],
];

function achromaticLimit(l: number): number {
  const pts = ACHROMATIC_CHROMA_BY_LIGHTNESS;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1] as readonly [number, number];
    const [x1, y1] = pts[i] as readonly [number, number];
    if (l <= x1) return y0 + ((y1 - y0) * (l - x0)) / (x1 - x0);
  }
  return (pts[pts.length - 1] as readonly [number, number])[1];
}

// 30° 폭 12구간. oklch hue 기준으로 red가 10°에서 시작한다(Tailwind red≈25°, blue≈260°, green≈150°).
const HUE_ORIGIN = 10;

const HUE_BUCKETS = [
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "purple",
  "pink",
] as const;

const LIGHTNESS_STEPS: readonly (readonly [number, number])[] = [
  [0.95, 50],
  [0.9, 100],
  [0.82, 200],
  [0.72, 300],
  [0.62, 400],
  [0.52, 500],
  [0.42, 600],
  [0.32, 700],
  [0.22, 800],
  [0.12, 900],
];

/** 이름에 쓰는 단계 사다리(밝은 쪽이 앞). `LIGHTNESS_STEPS`의 단계 + 950 */
export const COLOR_STEPS: readonly number[] = [...LIGHTNESS_STEPS.map(([, step]) => step), 950];

/** 색상 계열 이름: 채도가 낮으면 gray, 아니면 hue 구간 */
export function colorFamily(color: NormalizedColor): string {
  return color.c < achromaticLimit(color.l)
    ? "gray"
    : (HUE_BUCKETS[Math.floor((((color.h - HUE_ORIGIN) % 360) + 360) % 360 / 30)] ?? "gray");
}

/** 밝기(OKLCH l)에 해당하는 이상적인 단계의 `COLOR_STEPS` 인덱스 */
export function idealStepIndex(l: number): number {
  const i = LIGHTNESS_STEPS.findIndex(([min]) => l >= min);
  return i === -1 ? COLOR_STEPS.length - 1 : i;
}

function suggestName(color: NormalizedColor): string {
  return `${colorFamily(color)}-${COLOR_STEPS[idealStepIndex(color.l)]}`;
}

export function clusterColors(
  usages: StyleUsage[],
  opts: { threshold?: number } = {},
): ColorCluster[] {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;

  const counts = new Map<string, { color: NormalizedColor; count: number }>();
  for (const usage of usages) {
    if (usage.source !== "hardcoded" || usage.normalized.kind !== "color") continue;
    const entry = counts.get(usage.normalized.hex);
    if (entry === undefined) counts.set(usage.normalized.hex, { color: usage.normalized, count: 1 });
    else entry.count += 1;
  }

  const distinct = [...counts.values()].sort(
    (a, b) => b.count - a.count || (a.color.hex < b.color.hex ? -1 : 1),
  );

  const clusters: ColorCluster[] = [];
  for (const { color, count } of distinct) {
    const home = clusters.find((c) => colorDistance(c.representative, color) <= threshold);
    if (home === undefined) {
      clusters.push({
        representative: color,
        members: [{ hex: color.hex, count }],
        total: count,
        suggestedName: suggestName(color),
      });
    } else {
      home.members.push({ hex: color.hex, count });
      home.total += count;
    }
  }

  // members는 투입 순서가 이미 count 내림차순이다.
  return clusters.sort((a, b) => b.total - a.total);
}

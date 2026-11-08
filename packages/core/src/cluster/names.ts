import { colorFamily, type ColorCluster } from "./color-cluster.js";

/**
 * 첫 등장은 그대로, 같은 이름이 다시 나오면 -2, -3 …(이미 쓰인 이름은 건너뜀). 입력 순서를 유지한다.
 */
export function uniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((base) => {
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}-${n}`;
    used.add(name);
    return name;
  });
}

const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** 밝기(OKLCH l) → 이상적인 단계. 각 구간의 중심을 잇는 조각 선형 함수(밝을수록 작다). */
const IDEAL_ANCHORS: readonly (readonly [number, number])[] = [
  [1, 0],
  [0.975, 50],
  [0.925, 100],
  [0.86, 200],
  [0.77, 300],
  [0.67, 400],
  [0.57, 500],
  [0.47, 600],
  [0.37, 700],
  [0.27, 800],
  [0.17, 900],
  [0.08, 950],
  [0, 1000],
];

function idealStep(l: number): number {
  for (let i = 1; i < IDEAL_ANCHORS.length; i++) {
    const [l0, s0] = IDEAL_ANCHORS[i - 1] as readonly [number, number];
    const [l1, s1] = IDEAL_ANCHORS[i] as readonly [number, number];
    if (l >= l1) return s0 + ((s1 - s0) * (l0 - l)) / (l0 - l1);
  }
  return 1000;
}

/** 25…975, 25 간격 */
const LADDER: readonly number[] = Array.from({ length: 39 }, (_, i) => (i + 1) * 25);
const STANDARD_STEPS = new Set([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);

/** 표준 Tailwind 단계는 0, 나머지 50 배수는 60, 25 배수는 120 */
function offLadderPenalty(step: number): number {
  return STANDARD_STEPS.has(step) ? 0 : step % 50 === 0 ? 60 : 120;
}

/**
 * 밝은 순으로 정렬된 이상 단계들에 사다리 단계를 하나씩, 엄격히 증가하게 배정한다(번호가 밝기 순서를 거스르지 않음).
 * 비용 Σ(|이상−단계| + 비표준 단계 벌점)이 최소인 배정을 DP로 구하고, 동률이면 낮은 단계를 고른다.
 * 입력은 `LADDER.length` 이하여야 한다.
 */
function assignSteps(ideals: number[]): number[] {
  const n = ideals.length;
  const m = LADDER.length;
  const INF = Number.POSITIVE_INFINITY;
  let prev = new Array<number>(m).fill(0);
  const choice: number[][] = [];
  for (let i = 0; i < n; i++) {
    const cur = new Array<number>(m).fill(INF);
    const arg = new Array<number>(m).fill(-1);
    let best = INF;
    let bestJ = -1;
    for (let j = 0; j < m; j++) {
      if (i > 0 && j > 0 && (prev[j - 1] as number) < best) {
        best = prev[j - 1] as number;
        bestJ = j - 1;
      }
      const base = i === 0 ? 0 : best;
      if (base === INF) continue;
      const step = LADDER[j] as number;
      cur[j] = base + Math.abs((ideals[i] as number) - step) + offLadderPenalty(step);
      arg[j] = bestJ;
    }
    choice.push(arg);
    prev = cur;
  }
  let j = prev.indexOf(Math.min(...prev));
  const out = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    out[i] = LADDER[j] as number;
    j = (choice[i] as number[])[j] as number;
  }
  return out;
}

/** 이상 단계에 가장 가까운 표준 단계(한 계열이 사다리를 넘칠 때 접미사 이름의 바탕) */
function nearestStandardStep(ideal: number): number {
  let best = 500;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const s of [...STANDARD_STEPS].sort((a, b) => a - b)) {
    const d = Math.abs(s - ideal);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

/**
 * proposalTokens·audit 리포트·토큰 초안이 같은 색 이름을 쓰도록 모은 규칙. 입력과 같은 순서로 돌려준다.
 * - 순백(#ffffff)·순흑(#000000) 클러스터는 `white`·`black`
 * - 나머지는 계열(gray·red·…)별로 모아, OKLCH 밝기가 밝을수록 작은 단계가 되도록 25…975 사다리에 한 번에 배정한다.
 *   표준 단계(50, 100 … 900, 950)를 선호하고 그 사이 단계(150, 450 …)는 필요할 때만 쓴다
 * - 한 계열이 39개를 넘을 때만 사용 수가 적은 쪽이 `-2`, `-3` … 접미사를 받는다
 * 결정적이다(입력 순서와 무관하고, 사용 수는 39개 초과 시 접미사 대상을 고를 때만 쓰며, 동률은 hex 순).
 */
export function colorTokenNames(clusters: ColorCluster[]): string[] {
  const names = new Array<string>(clusters.length);
  const families = new Map<string, number[]>();
  clusters.forEach((c, i) => {
    const hex = c.representative.hex.toLowerCase();
    if (hex === "#ffffff") names[i] = "white";
    else if (hex === "#000000") names[i] = "black";
    else {
      const family = colorFamily(c.representative);
      families.set(family, [...(families.get(family) ?? []), i]);
    }
  });

  const lightFirst = (a: number, b: number): number => {
    const ca = clusters[a] as ColorCluster;
    const cb = clusters[b] as ColorCluster;
    return cb.representative.l - ca.representative.l || byCodeUnit(ca.representative.hex, cb.representative.hex);
  };
  const extras: { index: number; family: string }[] = [];
  for (const [family, indexes] of [...families].sort((a, b) => byCodeUnit(a[0], b[0]))) {
    let kept = indexes;
    if (indexes.length > LADDER.length) {
      // 사용 수가 많은 쪽이 단계를 받고, 나머지는 접미사
      const ranked = [...indexes].sort((a, b) => {
        const ca = clusters[a] as ColorCluster;
        const cb = clusters[b] as ColorCluster;
        return cb.total - ca.total || byCodeUnit(ca.representative.hex, cb.representative.hex);
      });
      kept = ranked.slice(0, LADDER.length);
      for (const index of ranked.slice(LADDER.length).sort(lightFirst)) extras.push({ index, family });
    }
    const sorted = [...kept].sort(lightFirst);
    const steps = assignSteps(sorted.map((i) => idealStep((clusters[i] as ColorCluster).representative.l)));
    sorted.forEach((i, k) => {
      names[i] = `${family}-${steps[k]}`;
    });
  }

  const used = new Set(names.filter((n) => n !== undefined));
  for (const { index, family } of extras) {
    const base = `${family}-${nearestStandardStep(idealStep((clusters[index] as ColorCluster).representative.l))}`;
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}-${n}`;
    used.add(name);
    names[index] = name;
  }
  return names;
}

/**
 * 순수 통계 함수 — 파일시스템·난수 시드 외 상태 없음. 같은 입력이면 같은 출력.
 * 표본이 작다(프롬프트 12개)는 전제로 정확 검정과 부트스트랩만 쓴다.
 */

export interface Summary {
  n: number;
  mean: number;
  min: number;
  max: number;
}

/** 산술 평균. 빈 배열은 NaN이 아니라 Error(호출자가 null을 걸러야 한다) */
export function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("빈 배열의 평균");
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** 평균·최소·최대. 빈 배열이면 null */
export function summarize(values: readonly number[]): Summary | null {
  if (values.length === 0) return null;
  let min = values[0] ?? 0;
  let max = min;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { n: values.length, mean: mean(values), min, max };
}

/** 소수 digits자리 반올림(기본 4) */
export function round(value: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/**
 * 이항(n, 1/2) 분포의 양쪽 정확 p값: 관측 확률(C(n,k)/2^n) 이하인 모든 결과의 확률을 더한다.
 * p=1/2이면 분포가 대칭이라 min(1, 2·P(X ≤ min(k, n-k)))와 같다. n=0이면 1.
 */
export function binomialTwoSidedP(k: number, n: number): number {
  if (!Number.isInteger(k) || !Number.isInteger(n) || n < 0 || k < 0 || k > n) throw new Error(`잘못된 이항 입력: k=${k}, n=${n}`);
  if (n === 0) return 1;
  // C(n, i)를 점화식으로 구한다(n ≤ ~1000에서 double로 정확, 이 하네스는 n ≤ 프롬프트 수)
  const comb: number[] = [1];
  for (let i = 1; i <= n; i += 1) comb.push(((comb[i - 1] ?? 0) * (n - i + 1)) / i);
  const observed = comb[k] ?? 0;
  let tail = 0;
  for (const c of comb) if (c <= observed * (1 + 1e-12)) tail += c;
  return Math.min(1, tail / 2 ** n);
}

export interface SignTest {
  /** diff > 0 */
  positive: number;
  /** diff < 0 */
  negative: number;
  /** diff === 0 (제외됨) */
  ties: number;
  /** positive + negative */
  n: number;
  /** 양쪽 정확 p값. n=0이면 null */
  p: number | null;
}

/** 부호 검정: 0 차이는 버리고, 양·음의 개수로 이항 정확 검정(양쪽). eps 이하의 차이는 0으로 본다 */
export function signTest(diffs: readonly number[], eps = 1e-12): SignTest {
  let positive = 0;
  let negative = 0;
  let ties = 0;
  for (const d of diffs) {
    if (d > eps) positive += 1;
    else if (d < -eps) negative += 1;
    else ties += 1;
  }
  const n = positive + negative;
  return { positive, negative, ties, n, p: n === 0 ? null : binomialTwoSidedP(Math.min(positive, negative), n) };
}

/** mulberry32 — 32비트 정수 연산만 써서 Node 버전과 무관하게 같은 수열 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const BOOTSTRAP_SEED = 20261107;
export const BOOTSTRAP_RESAMPLES = 10_000;

export interface BootstrapCI {
  mean: number;
  lo: number;
  hi: number;
  resamples: number;
  seed: number;
}

/**
 * 평균의 95% 백분위 부트스트랩 신뢰구간. 값(여기서는 프롬프트별 차이)을 복원추출로 `resamples`번 다시 뽑아
 * 평균을 구하고 정렬해 lo = sorted[floor(0.025·B)], hi = sorted[ceil(0.975·B) − 1]. 시드가 고정이라 결정적이다. 빈 입력이면 null.
 */
export function bootstrapMeanCI(values: readonly number[], opts: { seed?: number; resamples?: number } = {}): BootstrapCI | null {
  const n = values.length;
  if (n === 0) return null;
  const seed = opts.seed ?? BOOTSTRAP_SEED;
  const resamples = opts.resamples ?? BOOTSTRAP_RESAMPLES;
  const rng = mulberry32(seed);
  const means: number[] = [];
  for (let b = 0; b < resamples; b += 1) {
    let sum = 0;
    for (let i = 0; i < n; i += 1) sum += values[Math.floor(rng() * n)] ?? 0;
    means.push(sum / n);
  }
  means.sort((x, y) => x - y);
  return {
    mean: mean(values),
    lo: means[Math.floor(0.025 * resamples)] ?? 0,
    hi: means[Math.ceil(0.975 * resamples) - 1] ?? 0,
    resamples,
    seed,
  };
}

/** 동순위는 평균 순위(1부터) */
export function averageRanks(values: readonly number[]): number[] {
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v || a.i - b.i);
  const ranks = new Array<number>(values.length).fill(0);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1]?.v === order[i]?.v) j += 1;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) ranks[order[k]?.i ?? 0] = avg;
    i = j + 1;
  }
  return ranks;
}

/** 피어슨 상관. 분산이 0이면 null */
export function pearson(x: readonly number[], y: readonly number[]): number | null {
  if (x.length !== y.length) throw new Error("길이가 다른 입력");
  if (x.length < 2) return null;
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < x.length; i += 1) {
    const dx = (x[i] ?? 0) - mx;
    const dy = (y[i] ?? 0) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}

/** 스피어만 순위 상관(동순위는 평균 순위의 피어슨). 쌍이 2개 미만이거나 한쪽이 상수이면 null */
export function spearman(x: readonly number[], y: readonly number[]): number | null {
  return pearson(averageRanks(x), averageRanks(y));
}

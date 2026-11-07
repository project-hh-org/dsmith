import { describe, expect, it } from "vitest";
import {
  averageRanks,
  binomialTwoSidedP,
  bootstrapMeanCI,
  mean,
  mulberry32,
  pearson,
  round,
  signTest,
  spearman,
  summarize,
  tCritical975,
  tMeanCI,
} from "../src/stats.js";

describe("mean / summarize", () => {
  it("평균·최소·최대", () => {
    expect(mean([1, 2, 6])).toBe(3);
    expect(summarize([0.5, 0.25, 0.75])).toEqual({ n: 3, mean: 0.5, min: 0.25, max: 0.75 });
    expect(summarize([4])).toEqual({ n: 1, mean: 4, min: 4, max: 4 });
    expect(summarize([])).toBeNull();
    expect(() => mean([])).toThrow();
  });
  it("round는 소수 4자리 기본", () => {
    expect(round(0.123456)).toBe(0.1235);
    expect(round(2.5, 0)).toBe(3);
  });
});

describe("binomialTwoSidedP — 손으로 계산한 값", () => {
  it("n=12, k=0: 2/4096", () => {
    expect(binomialTwoSidedP(0, 12)).toBeCloseTo(2 / 4096, 12);
  });
  it("n=12, k=3: 2·(1+12+66+220)/4096 = 598/4096", () => {
    expect(binomialTwoSidedP(3, 12)).toBeCloseTo(598 / 4096, 12);
  });
  it("n=5, k=0: 2/32 = 0.0625", () => {
    expect(binomialTwoSidedP(0, 5)).toBeCloseTo(0.0625, 12);
  });
  it("n=10, k=1: 2·(1+10)/1024", () => {
    expect(binomialTwoSidedP(1, 10)).toBeCloseTo(22 / 1024, 12);
  });
  it("가운데(k=n/2)와 상한 1", () => {
    expect(binomialTwoSidedP(6, 12)).toBe(1);
    expect(binomialTwoSidedP(2, 4)).toBe(1);
    expect(binomialTwoSidedP(1, 3)).toBe(1);
    expect(binomialTwoSidedP(0, 1)).toBe(1);
    expect(binomialTwoSidedP(0, 0)).toBe(1);
  });
  it("대칭: k와 n-k가 같다", () => {
    expect(binomialTwoSidedP(9, 12)).toBeCloseTo(binomialTwoSidedP(3, 12), 12);
  });
  it("잘못된 입력은 Error", () => {
    expect(() => binomialTwoSidedP(-1, 3)).toThrow();
    expect(() => binomialTwoSidedP(4, 3)).toThrow();
    expect(() => binomialTwoSidedP(1.5, 3)).toThrow();
  });
});

describe("signTest", () => {
  it("0 차이는 버리고 양·음으로 센다", () => {
    const t = signTest([0.3, 0.1, 0, -0.2, 0.5, 0, 0.9]);
    expect(t).toMatchObject({ positive: 4, negative: 1, ties: 2, n: 5 });
    // n=5, min=1 → 2·(1+5)/32 = 12/32
    expect(t.p).toBeCloseTo(12 / 32, 12);
  });
  it("전부 양수 12개: p = 2/4096", () => {
    const t = signTest(Array.from({ length: 12 }, () => 0.5));
    expect(t).toMatchObject({ positive: 12, negative: 0, ties: 0, n: 12 });
    expect(t.p).toBeCloseTo(2 / 4096, 12);
  });
  it("전부 0이면 p는 null", () => {
    expect(signTest([0, 0, 0])).toEqual({ positive: 0, negative: 0, ties: 3, n: 0, p: null });
    expect(signTest([]).p).toBeNull();
  });
  it("부동소수 잡음(1e-15)은 0으로 본다", () => {
    expect(signTest([1e-15, -1e-15]).ties).toBe(2);
  });
});

describe("bootstrapMeanCI", () => {
  it("mulberry32는 같은 시드에서 같은 수열, [0,1)", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 5; i += 1) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(mulberry32(7)()).not.toBe(mulberry32(8)());
  });
  it("상수 입력이면 구간이 한 점", () => {
    const ci = bootstrapMeanCI([0.1, 0.1, 0.1, 0.1]);
    expect(ci).toMatchObject({ mean: 0.1, lo: 0.1, hi: 0.1, resamples: 10_000 });
  });
  it("[0, 1]: 재표본 평균은 {0, .5, 1}이고 0과 1이 각각 1/4 → 2.5%/97.5% 분위가 0과 1", () => {
    const ci = bootstrapMeanCI([0, 1]);
    expect(ci).toMatchObject({ mean: 0.5, lo: 0, hi: 1 });
  });
  it("[0, 0, 1, 1]: P(평균=0)=P(평균=1)=1/16 > 2.5% → 구간 [0, 1]", () => {
    expect(bootstrapMeanCI([0, 0, 1, 1])).toMatchObject({ lo: 0, hi: 1 });
  });
  it("결정적: 같은 입력·시드면 같은 결과, 시드를 바꾸면(대개) 달라도 구간은 평균을 포함", () => {
    const x = [0.2, 0.5, 0.9, 0.4, 0.1, 0.7, 0.3, 0.6, 0.8, 0.45, 0.55, 0.65];
    const a = bootstrapMeanCI(x);
    const b = bootstrapMeanCI(x);
    expect(a).toEqual(b);
    expect(a).not.toBeNull();
    if (a !== null) {
      expect(a.lo).toBeLessThanOrEqual(a.mean);
      expect(a.hi).toBeGreaterThanOrEqual(a.mean);
      expect(a.seed).toBe(20261107);
    }
    expect(bootstrapMeanCI(x, { seed: 1 })?.mean).toBeCloseTo(a?.mean ?? 0, 12);
  });
  it("빈 입력은 null", () => {
    expect(bootstrapMeanCI([])).toBeNull();
  });
  it("작은 resamples 옵션: 인덱스 = floor(0.025B), ceil(0.975B)-1", () => {
    const ci = bootstrapMeanCI([0, 1], { resamples: 40 });
    expect(ci?.resamples).toBe(40);
    expect(ci?.lo).toBeGreaterThanOrEqual(0);
    expect(ci?.hi).toBeLessThanOrEqual(1);
  });
});

describe("tMeanCI", () => {
  it("[1..5]: 평균 3, s=√2.5, se=√0.5, t(4)=2.7764 → [1.0368, 4.9632]", () => {
    const ci = tMeanCI([1, 2, 3, 4, 5]);
    expect(ci?.df).toBe(4);
    expect(ci?.mean).toBe(3);
    expect(ci?.lo).toBeCloseTo(3 - 2.7764 * Math.sqrt(0.5), 10);
    expect(ci?.hi).toBeCloseTo(3 + 2.7764 * Math.sqrt(0.5), 10);
  });
  it("상수 입력이면 구간이 한 점, 값이 2개 미만이면 null", () => {
    expect(tMeanCI([0.5, 0.5, 0.5])).toMatchObject({ lo: 0.5, hi: 0.5 });
    expect(tMeanCI([1])).toBeNull();
    expect(tMeanCI([])).toBeNull();
  });
  it("임계값: 표(df=11 → 2.2010)와 df>30 근사(df=60 → 약 2.0003, df=31 → 약 2.0395)", () => {
    expect(tCritical975(11)).toBeCloseTo(2.201, 3);
    expect(tCritical975(60)).toBeCloseTo(2.0003, 3);
    expect(tCritical975(31)).toBeCloseTo(2.0395, 3);
    expect(() => tCritical975(0)).toThrow();
  });
});

describe("순위 상관", () => {
  it("동순위는 평균 순위", () => {
    expect(averageRanks([10, 20, 20, 30])).toEqual([1, 2.5, 2.5, 4]);
    expect(averageRanks([3, 1, 2])).toEqual([3, 1, 2]);
  });
  it("피어슨: 완전한 선형은 1, 분산 0이면 null", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 12);
    expect(pearson([1, 2, 3], [5, 5, 5])).toBeNull();
    expect(pearson([1], [1])).toBeNull();
  });
  it("스피어만 [1,2,3] vs [1,3,2] = 0.5", () => {
    expect(spearman([1, 2, 3], [1, 3, 2])).toBeCloseTo(0.5, 12);
  });
  it("스피어만 단조 변환은 1, 역순은 -1", () => {
    expect(spearman([1, 2, 3, 4], [1, 4, 9, 16])).toBeCloseTo(1, 12);
    expect(spearman([1, 2, 3, 4], [9, 7, 5, 1])).toBeCloseTo(-1, 12);
  });
  it("동순위가 있는 스피어만: 4.5/√22.5", () => {
    expect(spearman([1, 2, 2, 3], [1, 2, 3, 4])).toBeCloseTo(4.5 / Math.sqrt(22.5), 12);
  });
  it("길이가 다르면 Error", () => {
    expect(() => spearman([1, 2], [1])).toThrow();
  });
});

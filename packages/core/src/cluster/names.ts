import { COLOR_STEPS, colorFamily, idealStepIndex, type ColorCluster } from "./color-cluster.js";

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

/**
 * 계열 안의 클러스터(밝은 순으로 정렬됨)에 단계를 준다. 각자 이상적인 단계(밝기 구간)를 원하고,
 * 겹치면 밝은 쪽부터 다음 빈 단계로 밀어 번호가 밝기 순서를 거스르지 않게 한다(끝에서 넘치면 되돌려 앞으로 민다).
 * 반환: 입력과 같은 순서의 `COLOR_STEPS` 인덱스. 입력은 `COLOR_STEPS.length` 이하여야 한다.
 */
function assignSteps(ideal: number[]): number[] {
  const out = [...ideal];
  for (let k = 1; k < out.length; k++) out[k] = Math.max(out[k] as number, (out[k - 1] as number) + 1);
  const last = COLOR_STEPS.length - 1;
  if ((out[out.length - 1] ?? 0) > last) {
    out[out.length - 1] = last;
    for (let k = out.length - 2; k >= 0; k--) out[k] = Math.min(out[k] as number, (out[k + 1] as number) - 1);
  }
  return out;
}

/**
 * proposalTokens·audit 리포트·토큰 초안이 같은 색 이름을 쓰도록 모은 규칙. 입력과 같은 순서로 돌려준다.
 * - 순백(#ffffff)·순흑(#000000) 클러스터는 `white`·`black`
 * - 나머지는 계열(gray·red·…)별로 모아 OKLCH 밝기가 밝을수록 작은 단계(50…950)를 준다. 같은 단계를 원하면 가까운 빈 단계로 가고,
 *   한 계열이 11개를 넘을 때만 사용 수가 적은 쪽이 `-2`, `-3` … 접미사를 받는다
 * 결정적이다(입력 순서·사용 수는 접미사 대상을 고를 때만 쓰고, 동률은 hex 순).
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
    if (indexes.length > COLOR_STEPS.length) {
      // 사용 수가 많은 쪽 11개가 단계를 받고, 나머지는 접미사
      const ranked = [...indexes].sort((a, b) => {
        const ca = clusters[a] as ColorCluster;
        const cb = clusters[b] as ColorCluster;
        return cb.total - ca.total || byCodeUnit(ca.representative.hex, cb.representative.hex);
      });
      kept = ranked.slice(0, COLOR_STEPS.length);
      for (const index of ranked.slice(COLOR_STEPS.length).sort(lightFirst)) extras.push({ index, family });
    }
    const sorted = [...kept].sort(lightFirst);
    const steps = assignSteps(sorted.map((i) => idealStepIndex((clusters[i] as ColorCluster).representative.l)));
    sorted.forEach((i, k) => {
      names[i] = `${family}-${COLOR_STEPS[steps[k] as number]}`;
    });
  }

  const used = new Set(names.filter((n) => n !== undefined));
  for (const { index, family } of extras) {
    const base = `${family}-${COLOR_STEPS[idealStepIndex((clusters[index] as ColorCluster).representative.l)]}`;
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}-${n}`;
    used.add(name);
    names[index] = name;
  }
  return names;
}

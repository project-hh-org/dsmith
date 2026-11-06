import type { Summary } from "./stats.js";

export const DASH = "—";
export const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** 0..1 → "12.5%". null이면 "—" */
export function pct(value: number | null | undefined): string {
  return value === null || value === undefined ? DASH : `${(value * 100).toFixed(1)}%`;
}

/** 비율 + 분자/분모. 분모 0이면 "— (0/0)" */
export function ratioCell(num: number, den: number): string {
  return den === 0 ? `${DASH} (${num}/${den})` : `${pct(num / den)} (${num}/${den})`;
}

export function esc(text: string): string {
  return text.replace(/\|/g, "\\|");
}

export function table(header: string[], rows: string[][]): string[] {
  return [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)];
}

/** 비율 차이(0..1)를 "+68.1%p" / "-3.0%p" */
export function pp(diff: number | null | undefined): string {
  if (diff === null || diff === undefined) return DASH;
  const v = Math.round(Math.abs(diff) * 1000) / 10;
  return `${diff < 0 && v !== 0 ? "-" : "+"}${v.toFixed(1)}%p`;
}

/** 부호 있는 %p 숫자("+60.1") — CI 끝점용 */
export function ppNum(diff: number): string {
  return pp(diff).replace("%p", "");
}

/** 정수 개수의 평균/차이: 소수 둘째 자리까지(끝 0 유지) */
export function num(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined ? DASH : value.toFixed(digits);
}

export function signedNum(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return DASH;
  const rounded = Number(value.toFixed(digits));
  return `${rounded < 0 ? "-" : "+"}${Math.abs(rounded).toFixed(digits)}`;
}

/** p값: 0.0020 / <0.0001 / — */
export function pValue(p: number | null | undefined): string {
  if (p === null || p === undefined) return DASH;
  return p < 0.0001 ? "<0.0001" : p.toFixed(4);
}

/** 평균 (최소–최대). kind=pct면 퍼센트, count면 평균 소수 1자리·최소/최대는 그대로 */
export function rangeCell(s: Summary | null, kind: "pct" | "count"): string {
  if (s === null) return DASH;
  if (kind === "pct") return `${pct(s.mean)} (${pct(s.min)}–${pct(s.max)})`;
  return `${s.mean.toFixed(1)} (${s.min}–${s.max})`;
}

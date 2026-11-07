"use client";

import type { CSSProperties } from "react";
import { Button } from "./ui/button";

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export interface FilterSidebarProps {
  categories: string[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset?: () => void;
}

export const EMPTY_FILTER: FilterState = { categories: [], minPrice: "", maxPrice: "" };

const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-5)",
    padding: "var(--space-4)",
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
    width: "100%",
    maxWidth: 260,
  },
  title: { margin: 0, fontSize: "var(--text-xl)", color: "var(--color-blue-900)" },
  fieldset: { border: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" },
  legend: { padding: 0, marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-gray-500)" },
  check: { display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-blue-900)" },
  priceRow: { display: "flex", alignItems: "center", gap: "var(--space-2)" },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "var(--space-2) var(--space-3)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-blue-900)",
  },
  error: { margin: 0, fontSize: "var(--text-xs)", color: "var(--color-red-500)" },
};

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const min = value.minPrice === "" ? null : Number(value.minPrice);
  const max = value.maxPrice === "" ? null : Number(value.maxPrice);
  const invalidRange = min !== null && max !== null && min > max;

  const toggle = (category: string) => {
    const next = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  };

  const reset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside aria-label="상품 필터" style={styles.root}>
      <h2 style={styles.title}>필터</h2>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>카테고리</legend>
        {categories.map((category) => (
          <label key={category} style={styles.check}>
            <input
              type="checkbox"
              checked={value.categories.includes(category)}
              onChange={() => toggle(category)}
            />
            {category}
          </label>
        ))}
      </fieldset>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>가격 범위</legend>
        <div style={styles.priceRow}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            style={styles.input}
          />
          <span aria-hidden="true">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            style={styles.input}
          />
        </div>
        {invalidRange && (
          <p role="alert" style={styles.error}>
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" onClick={reset}>
        초기화
      </Button>
    </aside>
  );
}

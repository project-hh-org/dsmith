import { useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "./ui/button";

export interface FilterCategory {
  id: string;
  label: string;
}

export interface FilterValue {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export interface FilterSidebarProps {
  categories: FilterCategory[];
  value?: FilterValue;
  onChange?: (value: FilterValue) => void;
  className?: string;
}

const emptyValue: FilterValue = { categories: [], minPrice: "", maxPrice: "" };

const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
    padding: "var(--space-4)",
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-blue-900)",
  },
  title: { margin: 0, fontSize: "var(--text-xl)", fontWeight: 600 },
  group: { display: "flex", flexDirection: "column", gap: "var(--space-2)", border: 0, margin: 0, padding: 0 },
  legend: { padding: 0, marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-gray-500)" },
  checkLabel: { display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)" },
  priceRow: { display: "flex", alignItems: "center", gap: "var(--space-2)" },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "var(--space-2) var(--space-3)",
    fontSize: "var(--text-xs)",
    color: "var(--color-blue-900)",
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
  },
  error: { margin: 0, fontSize: "var(--text-xs)", color: "var(--color-red-500)" },
};

export function FilterSidebar({ categories, value, onChange, className }: FilterSidebarProps) {
  const [inner, setInner] = useState<FilterValue>(emptyValue);
  const current = value ?? inner;

  const update = (next: FilterValue) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const toggle = (id: string) => {
    const has = current.categories.includes(id);
    update({
      ...current,
      categories: has ? current.categories.filter((c) => c !== id) : [...current.categories, id],
    });
  };

  const min = Number(current.minPrice);
  const max = Number(current.maxPrice);
  const invalidRange = current.minPrice !== "" && current.maxPrice !== "" && min > max;

  return (
    <aside className={className} style={styles.root} aria-label="상품 필터">
      <h2 style={styles.title}>필터</h2>

      <fieldset style={styles.group}>
        <legend style={styles.legend}>카테고리</legend>
        {categories.map((c) => (
          <label key={c.id} style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={current.categories.includes(c.id)}
              onChange={() => toggle(c.id)}
            />
            {c.label}
          </label>
        ))}
      </fieldset>

      <fieldset style={styles.group}>
        <legend style={styles.legend}>가격 범위</legend>
        <div style={styles.priceRow}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            style={styles.input}
            value={current.minPrice}
            onChange={(e) => update({ ...current, minPrice: e.target.value })}
          />
          <span aria-hidden="true">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            style={styles.input}
            value={current.maxPrice}
            onChange={(e) => update({ ...current, maxPrice: e.target.value })}
          />
        </div>
        {invalidRange && (
          <p role="alert" style={styles.error}>
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={() => update(emptyValue)}>
        초기화
      </Button>
    </aside>
  );
}

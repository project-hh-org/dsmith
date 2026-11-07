import type { CSSProperties } from "react";
import { Button } from "./ui/button";

export interface FilterValue {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export interface FilterSidebarProps {
  categories: string[];
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  onReset?: () => void;
}

const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-5)",
    padding: "var(--space-4)",
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
  },
  title: { margin: 0, fontSize: "var(--text-xl)", color: "var(--color-blue-900)" },
  fieldset: {
    margin: 0,
    padding: 0,
    border: 0,
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },
  legend: {
    padding: 0,
    marginBottom: "var(--space-2)",
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  check: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    color: "var(--color-blue-900)",
  },
  priceRow: { display: "flex", alignItems: "center", gap: "var(--space-2)" },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "var(--space-2) var(--space-3)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-blue-900)",
  },
  sep: { color: "var(--color-gray-500)" },
};

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const toggle = (category: string) => {
    const selected = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: selected });
  };

  const reset = () => {
    onChange({ categories: [], minPrice: "", maxPrice: "" });
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
          <span style={styles.sep} aria-hidden="true">~</span>
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
      </fieldset>

      <Button type="button" variant="outline" onClick={reset}>
        초기화
      </Button>
    </aside>
  );
}

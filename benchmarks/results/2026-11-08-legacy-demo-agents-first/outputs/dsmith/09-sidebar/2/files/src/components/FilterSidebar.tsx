import type { CSSProperties } from "react";
import { Button } from "./ui/button";

export interface PriceRange {
  min: string;
  max: string;
}

export interface FilterCategory {
  id: string;
  label: string;
}

export interface FilterSidebarProps {
  categories: FilterCategory[];
  selectedCategories: string[];
  priceRange: PriceRange;
  onCategoryChange: (selected: string[]) => void;
  onPriceRangeChange: (range: PriceRange) => void;
  onReset: () => void;
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
    color: "var(--color-blue-900)",
  },
  title: { margin: 0, fontSize: "var(--text-xl)", fontWeight: 600 },
  fieldset: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
    margin: 0,
    padding: 0,
    border: 0,
  },
  legend: {
    padding: 0,
    marginBottom: "var(--space-2)",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    color: "var(--color-gray-500)",
  },
  checkLabel: { display: "flex", alignItems: "center", gap: "var(--space-2)" },
  priceRow: { display: "flex", alignItems: "center", gap: "var(--space-2)" },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "var(--space-2) var(--space-3)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
    background: "var(--color-gray-50)",
    color: "var(--color-blue-900)",
  },
};

export function FilterSidebar({
  categories,
  selectedCategories,
  priceRange,
  onCategoryChange,
  onPriceRangeChange,
  onReset,
}: FilterSidebarProps) {
  const toggleCategory = (id: string) => {
    onCategoryChange(
      selectedCategories.includes(id)
        ? selectedCategories.filter((c) => c !== id)
        : [...selectedCategories, id],
    );
  };

  return (
    <aside aria-label="상품 필터" style={styles.root}>
      <h2 style={styles.title}>필터</h2>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>카테고리</legend>
        {categories.map((category) => (
          <label key={category.id} style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
            />
            {category.label}
          </label>
        ))}
      </fieldset>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>가격 범위</legend>
        <div style={styles.priceRow}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="최소"
            aria-label="최소 가격"
            value={priceRange.min}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            style={styles.input}
          />
          <span aria-hidden="true">~</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="최대"
            aria-label="최대 가격"
            value={priceRange.max}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            style={styles.input}
          />
        </div>
      </fieldset>

      <Button type="button" variant="outline" onClick={onReset}>
        초기화
      </Button>
    </aside>
  );
}

import { useId } from "react";
import type { CSSProperties } from "react";
import { Button } from "./ui/button";

export interface FilterCategory {
  value: string;
  label: string;
  count?: number;
}

export interface PriceRange {
  min: string;
  max: string;
}

export interface FilterSidebarProps {
  categories: FilterCategory[];
  selectedCategories: string[];
  priceRange: PriceRange;
  onCategoryChange: (selected: string[]) => void;
  onPriceRangeChange: (range: PriceRange) => void;
  onReset: () => void;
  className?: string;
}

// 값은 모두 design-system/tokens.css 의 CSS 변수를 쓴다.
const styles = {
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
  legend: { padding: 0, marginBottom: "var(--space-2)", fontWeight: 600 },
  option: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    fontSize: "var(--text-xs)",
  },
  count: { marginLeft: "auto", color: "var(--color-gray-500)" },
  priceRow: { display: "flex", alignItems: "center", gap: "var(--space-2)" },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "var(--space-2) var(--space-3)",
    fontSize: "var(--text-xs)",
    color: "var(--color-blue-900)",
    background: "white",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
  },
  separator: { color: "var(--color-gray-500)" },
  error: { margin: 0, fontSize: "var(--text-xs)", color: "var(--color-red-500)" },
} satisfies Record<string, CSSProperties>;

export function FilterSidebar({
  categories,
  selectedCategories,
  priceRange,
  onCategoryChange,
  onPriceRangeChange,
  onReset,
  className,
}: FilterSidebarProps) {
  const id = useId();
  const minId = `${id}-min`;
  const maxId = `${id}-max`;
  const errorId = `${id}-error`;

  const min = priceRange.min === "" ? null : Number(priceRange.min);
  const max = priceRange.max === "" ? null : Number(priceRange.max);
  const invalidRange = min !== null && max !== null && min > max;

  const toggle = (value: string, checked: boolean) => {
    onCategoryChange(
      checked
        ? [...selectedCategories, value]
        : selectedCategories.filter((v) => v !== value),
    );
  };

  return (
    <aside aria-label="상품 필터" className={className} style={styles.root}>
      <h2 style={styles.title}>필터</h2>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>카테고리</legend>
        {categories.map((c) => (
          <label key={c.value} style={styles.option}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(c.value)}
              onChange={(e) => toggle(c.value, e.target.checked)}
            />
            <span>{c.label}</span>
            {c.count !== undefined && <span style={styles.count}>{c.count}</span>}
          </label>
        ))}
      </fieldset>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>가격 범위</legend>
        <div style={styles.priceRow}>
          <label htmlFor={minId} className="sr-only">
            최소 가격
          </label>
          <input
            id={minId}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="최소"
            value={priceRange.min}
            aria-invalid={invalidRange}
            aria-describedby={invalidRange ? errorId : undefined}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            style={styles.input}
          />
          <span aria-hidden="true" style={styles.separator}>
            ~
          </span>
          <label htmlFor={maxId} className="sr-only">
            최대 가격
          </label>
          <input
            id={maxId}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="최대"
            value={priceRange.max}
            aria-invalid={invalidRange}
            aria-describedby={invalidRange ? errorId : undefined}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            style={styles.input}
          />
        </div>
        {invalidRange && (
          <p id={errorId} role="alert" style={styles.error}>
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" onClick={onReset}>
        초기화
      </Button>
    </aside>
  );
}

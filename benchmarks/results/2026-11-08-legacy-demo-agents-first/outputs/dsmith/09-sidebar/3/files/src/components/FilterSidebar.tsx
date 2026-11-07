"use client";

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
  onCategoriesChange: (selected: string[]) => void;
  onPriceRangeChange: (range: PriceRange) => void;
  onReset: () => void;
}

const asideStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
  padding: "var(--space-4)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  color: "var(--color-blue-900)",
};

const legendStyle: CSSProperties = {
  padding: 0,
  marginBottom: "var(--space-2)",
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const fieldsetStyle: CSSProperties = { border: 0, margin: 0, padding: 0 };

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  padding: "var(--space-2) 0",
  fontSize: "var(--text-xs)",
  color: "var(--color-blue-900)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "var(--space-2)",
  fontSize: "var(--text-xs)",
  color: "var(--color-blue-900)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
};

const errorStyle: CSSProperties = {
  margin: "var(--space-2) 0 0",
  fontSize: "var(--text-xs)",
  color: "var(--color-red-500)",
};

export function FilterSidebar({
  categories,
  selectedCategories,
  priceRange,
  onCategoriesChange,
  onPriceRangeChange,
  onReset,
}: FilterSidebarProps) {
  const toggle = (id: string) =>
    onCategoriesChange(
      selectedCategories.includes(id)
        ? selectedCategories.filter((c) => c !== id)
        : [...selectedCategories, id],
    );

  const min = priceRange.min === "" ? null : Number(priceRange.min);
  const max = priceRange.max === "" ? null : Number(priceRange.max);
  const invalid = min !== null && max !== null && min > max;

  return (
    <aside aria-label="상품 필터" style={asideStyle}>
      <h2 style={titleStyle}>필터</h2>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>카테고리</legend>
        {categories.map((category) => (
          <label key={category.id} style={rowStyle}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.id)}
              onChange={() => toggle(category.id)}
            />
            {category.label}
          </label>
        ))}
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>가격 범위</legend>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            value={priceRange.min}
            aria-invalid={invalid}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            style={inputStyle}
          />
          <span aria-hidden="true">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={priceRange.max}
            aria-invalid={invalid}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            style={inputStyle}
          />
        </div>
        {invalid && (
          <p role="alert" style={errorStyle}>
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        초기화
      </Button>
    </aside>
  );
}

export default FilterSidebar;

"use client";

import { Button } from "@/components/ui/button";

export interface FilterCategory {
  value: string;
  label: string;
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
  onPriceChange: (range: PriceRange) => void;
  onReset: () => void;
}

export function FilterSidebar({
  categories,
  selectedCategories,
  priceRange,
  onCategoryChange,
  onPriceChange,
  onReset,
}: FilterSidebarProps) {
  const toggle = (value: string) => {
    onCategoryChange(
      selectedCategories.includes(value)
        ? selectedCategories.filter((v) => v !== value)
        : [...selectedCategories, value],
    );
  };

  const inputClass =
    "w-full border border-[var(--color-gray-100)] bg-white px-[var(--space-3)] py-[var(--space-2)] " +
    "text-[length:var(--text-xs)] text-[var(--color-blue-900)] rounded-[var(--radius-sm)] " +
    "focus:border-[var(--color-blue-400)] focus:outline-none";

  const invalidRange =
    priceRange.min !== "" && priceRange.max !== "" && Number(priceRange.min) > Number(priceRange.max);

  return (
    <aside
      aria-label="상품 필터"
      className="flex w-64 flex-col gap-[var(--space-5)] border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-[var(--space-4)] rounded-[var(--radius-sm)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((c) => (
          <label
            key={c.value}
            className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(c.value)}
              onChange={() => toggle(c.value)}
            />
            {c.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          가격 범위
        </legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            value={priceRange.min}
            onChange={(e) => onPriceChange({ ...priceRange, min: e.target.value })}
            className={inputClass}
          />
          <span aria-hidden className="text-[var(--color-gray-500)]">
            ~
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={priceRange.max}
            onChange={(e) => onPriceChange({ ...priceRange, max: e.target.value })}
            className={inputClass}
          />
        </div>
        {invalidRange && (
          <span role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </span>
        )}
      </fieldset>

      <Button type="button" variant="outline" onClick={onReset}>
        초기화
      </Button>
    </aside>
  );
}

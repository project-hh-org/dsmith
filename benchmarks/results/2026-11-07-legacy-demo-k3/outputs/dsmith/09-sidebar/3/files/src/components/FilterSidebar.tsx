"use client";

import clsx from "clsx";
import { Button } from "@/components/ui/button";

export interface FilterCategory {
  id: string;
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
  onCategoriesChange: (selected: string[]) => void;
  onPriceRangeChange: (range: PriceRange) => void;
  onReset: () => void;
  className?: string;
}

const inputClass = clsx(
  "block w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)]",
  "bg-white px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)]",
  "text-[var(--color-blue-900)] focus:border-[var(--color-blue-400)] focus:outline-none",
);

export function FilterSidebar({
  categories,
  selectedCategories,
  priceRange,
  onCategoriesChange,
  onPriceRangeChange,
  onReset,
  className,
}: FilterSidebarProps) {
  const toggleCategory = (id: string) => {
    onCategoriesChange(
      selectedCategories.includes(id)
        ? selectedCategories.filter((c) => c !== id)
        : [...selectedCategories, id],
    );
  };

  const invalidRange =
    priceRange.min !== "" &&
    priceRange.max !== "" &&
    Number(priceRange.min) > Number(priceRange.max);

  return (
    <aside
      aria-label="상품 필터"
      className={clsx(
        "flex w-56 flex-col gap-[var(--space-5)] bg-[var(--color-gray-50)] p-[var(--space-4)]",
        "rounded-[var(--radius-sm)]",
        className,
      )}
    >
      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-3)] text-[length:var(--text-xs)] font-bold text-[var(--color-blue-900)]">
          카테고리
        </legend>
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
              className="h-4 w-4 accent-[var(--color-blue-400)]"
            />
            {category.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-3)] text-[length:var(--text-xs)] font-bold text-[var(--color-blue-900)]">
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
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            className={inputClass}
          />
          <span className="text-[var(--color-gray-500)]">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={priceRange.max}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            className={inputClass}
          />
        </div>
        {invalidRange && (
          <p role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 큽니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        초기화
      </Button>
    </aside>
  );
}

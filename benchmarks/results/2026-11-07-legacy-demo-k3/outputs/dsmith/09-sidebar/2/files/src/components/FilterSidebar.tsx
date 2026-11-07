"use client";

import { Button } from "@/components/ui/button";

export interface FilterCategory {
  value: string;
  label: string;
}

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset?: () => void;
  className?: string;
}

export const EMPTY_FILTER: FilterState = { categories: [], minPrice: "", maxPrice: "" };

const priceInputClass =
  "block w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)] focus:border-[var(--color-blue-400)] focus:outline-none";

export function FilterSidebar({ categories, value, onChange, onReset, className }: FilterSidebarProps) {
  const toggleCategory = (category: string) => {
    const next = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  };

  const priceInvalid =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);

  const handleReset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className={`flex w-56 flex-col gap-[var(--space-5)] bg-[var(--color-gray-50)] p-[var(--space-4)] ${className ?? ""}`}
    >
      <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((category) => (
          <label
            key={category.value}
            className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
          >
            <input
              type="checkbox"
              checked={value.categories.includes(category.value)}
              onChange={() => toggleCategory(category.value)}
            />
            {category.label}
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
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className={priceInputClass}
          />
          <span className="text-[var(--color-gray-500)]">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className={priceInputClass}
          />
        </div>
        {priceInvalid && (
          <span role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 큽니다.
          </span>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={handleReset}>
        초기화
      </Button>
    </aside>
  );
}

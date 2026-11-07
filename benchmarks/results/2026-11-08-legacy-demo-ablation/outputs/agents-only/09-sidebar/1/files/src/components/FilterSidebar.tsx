"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/Input";

export interface ProductFilters {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_FILTERS: ProductFilters = {
  categories: [],
  minPrice: "",
  maxPrice: "",
};

interface FilterSidebarProps {
  categories: string[];
  value: ProductFilters;
  onChange: (next: ProductFilters) => void;
}

export function FilterSidebar({ categories, value, onChange }: FilterSidebarProps) {
  const toggleCategory = (category: string) => {
    const next = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  };

  const priceInvalid =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);

  return (
    <aside
      aria-label="상품 필터"
      className="w-60 flex flex-col gap-[var(--space-5)] border-r border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-[var(--space-4)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((category) => (
          <label
            key={category}
            className="flex items-center gap-[var(--space-2)] text-sm text-[var(--color-blue-900)]"
          >
            <input
              type="checkbox"
              checked={value.categories.includes(category)}
              onChange={() => toggleCategory(category)}
              className="h-4 w-4 rounded-[var(--radius-sm)] border border-[var(--color-gray-100)]"
            />
            {category}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-3)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          가격 범위
        </legend>
        <Input
          id="filter-min-price"
          label="최소 가격"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          value={value.minPrice}
          onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
        />
        <Input
          id="filter-max-price"
          label="최대 가격"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="제한 없음"
          value={value.maxPrice}
          onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
          error={priceInvalid ? "최소 가격이 최대 가격보다 큽니다" : undefined}
        />
      </fieldset>

      <Button variant="outline" onClick={() => onChange(EMPTY_FILTERS)}>
        초기화
      </Button>
    </aside>
  );
}

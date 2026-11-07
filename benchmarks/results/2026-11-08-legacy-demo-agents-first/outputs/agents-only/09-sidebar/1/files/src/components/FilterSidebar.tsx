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

export const EMPTY_FILTER: FilterState = { categories: [], minPrice: "", maxPrice: "" };

export interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  className?: string;
}

const inputClass =
  "block w-full rounded-ds-sm border border-ds-gray-100 bg-white px-ds-3 py-ds-2 text-ds-xs text-ds-blue-900 focus:border-ds-blue-400 focus:outline-none";

export function FilterSidebar({ categories, value, onChange, className }: FilterSidebarProps) {
  const toggleCategory = (category: string) => {
    const next = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  };

  const priceInvalid =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);

  const isDirty =
    value.categories.length > 0 || value.minPrice !== "" || value.maxPrice !== "";

  return (
    <aside
      aria-label="상품 필터"
      className={`flex w-56 flex-col gap-ds-5 rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50 p-ds-4 ${className ?? ""}`}
    >
      <h2 className="text-ds-xl font-bold text-ds-blue-900">필터</h2>

      <fieldset className="flex flex-col gap-ds-2">
        <legend className="mb-ds-2 text-ds-xs font-medium text-ds-gray-500">카테고리</legend>
        {categories.map((category) => (
          <label
            key={category.value}
            className="flex items-center gap-ds-2 text-ds-xs text-ds-blue-900"
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

      <fieldset className="flex flex-col gap-ds-2">
        <legend className="mb-ds-2 text-ds-xs font-medium text-ds-gray-500">가격 범위</legend>
        <div className="flex items-center gap-ds-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className={inputClass}
          />
          <span className="text-ds-xs text-ds-gray-500">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className={inputClass}
          />
        </div>
        {priceInvalid && (
          <span role="alert" className="text-ds-xs text-ds-red-500">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </span>
        )}
      </fieldset>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!isDirty}
        onClick={() => onChange(EMPTY_FILTER)}
      >
        초기화
      </Button>
    </aside>
  );
}

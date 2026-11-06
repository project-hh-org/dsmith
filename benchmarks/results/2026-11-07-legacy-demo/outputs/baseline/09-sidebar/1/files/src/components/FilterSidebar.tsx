"use client";

import { Button } from "./Button";

export interface ProductFilters {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
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

  const dirty =
    value.categories.length > 0 || value.minPrice !== "" || value.maxPrice !== "";

  return (
    <aside className="w-56 bg-white border-r border-gray-200 px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand">필터</h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!dirty}
          onClick={() => onChange(EMPTY_PRODUCT_FILTERS)}
          className="disabled:opacity-50"
        >
          초기화
        </Button>
      </div>

      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-gray-900">카테고리</legend>
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={value.categories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="h-4 w-4 rounded border-gray-300 accent-brand"
              />
              {category}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-900">가격 범위</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <span className="text-gray-500">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        {priceInvalid && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>
    </aside>
  );
}

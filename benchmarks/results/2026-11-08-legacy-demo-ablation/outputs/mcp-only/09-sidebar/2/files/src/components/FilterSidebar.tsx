"use client";

import { Button } from "./Button";
import { Input } from "./forms/Input";

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

interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset?: () => void;
}

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const min = value.minPrice === "" ? null : Number(value.minPrice);
  const max = value.maxPrice === "" ? null : Number(value.maxPrice);
  const rangeInvalid = min !== null && max !== null && min > max;

  const toggleCategory = (category: string) => {
    const categories = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories });
  };

  const handleReset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside className="w-56 bg-white border-r border-gray-200 px-3 py-6">
      <h2 className="px-3 mb-4 text-lg font-bold text-brand">필터</h2>

      <fieldset className="px-3 mb-6">
        <legend className="mb-2 text-sm font-medium text-gray-900">카테고리</legend>
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <label key={category.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={value.categories.includes(category.value)}
                onChange={() => toggleCategory(category.value)}
                className="h-4 w-4 rounded border-gray-300 accent-brand"
              />
              {category.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="px-3 mb-6">
        <legend className="mb-2 text-sm font-medium text-gray-900">가격 범위</legend>
        <div className="flex items-end gap-2">
          <Input
            id="filter-min-price"
            label="최소"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
          />
          <span className="pb-2 text-gray-500">~</span>
          <Input
            id="filter-max-price"
            label="최대"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="무제한"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
          />
        </div>
        {rangeInvalid && (
          <p role="alert" className="mt-1 text-xs text-[#e53e3e]">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <div className="px-3">
        <Button variant="secondary" size="sm" type="button" className="w-full" onClick={handleReset}>
          초기화
        </Button>
      </div>
    </aside>
  );
}

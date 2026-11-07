"use client";

import { Button } from "./Button";
import { Input } from "./forms/Input";

export interface FilterCategory {
  value: string;
  label: string;
}

export interface FilterValue {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_FILTER: FilterValue = { categories: [], minPrice: "", maxPrice: "" };

interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  onReset?: () => void;
}

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const toggleCategory = (category: string) => {
    const categories = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories });
  };

  const invalidRange =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);

  const handleReset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside className="w-56 bg-white border-r border-gray-200 px-3 py-6">
      <h2 className="px-3 mb-4 text-lg font-bold text-brand">필터</h2>

      <fieldset className="mb-6 px-3">
        <legend className="mb-2 text-sm font-medium text-gray-900">카테고리</legend>
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <label key={category.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={value.categories.includes(category.value)}
                onChange={() => toggleCategory(category.value)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {category.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-6 px-3">
        <legend className="mb-2 text-sm font-medium text-gray-900">가격 범위</legend>
        <div className="flex flex-col gap-3">
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
            error={invalidRange ? "최소 가격이 최대 가격보다 클 수 없습니다" : undefined}
          />
        </div>
      </fieldset>

      <div className="px-3">
        <Button variant="secondary" className="w-full" type="button" onClick={handleReset}>
          초기화
        </Button>
      </div>
    </aside>
  );
}

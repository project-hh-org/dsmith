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
  className?: string;
}

export function FilterSidebar({ categories, value, onChange, onReset, className }: FilterSidebarProps) {
  const min = value.minPrice === "" ? null : Number(value.minPrice);
  const max = value.maxPrice === "" ? null : Number(value.maxPrice);
  const rangeError = min !== null && max !== null && min > max ? "최소 금액이 최대 금액보다 큽니다" : undefined;

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
    <aside className={`w-60 bg-white border-r border-gray-200 px-4 py-6 ${className ?? ""}`}>
      <h2 className="mb-4 text-lg font-bold text-gray-900">필터</h2>

      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-gray-700">카테고리</legend>
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <label key={c.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={value.categories.includes(c.value)}
                onChange={() => toggleCategory(c.value)}
                className="h-4 w-4 rounded border-gray-300 accent-brand"
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-gray-700">가격 범위</legend>
        <div className="flex flex-col gap-3">
          <Input
            id="filter-min-price"
            label="최소 금액"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
          />
          <Input
            id="filter-max-price"
            label="최대 금액"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="제한 없음"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            error={rangeError}
          />
        </div>
      </fieldset>

      <Button type="button" variant="secondary" className="w-full" onClick={handleReset}>
        초기화
      </Button>
    </aside>
  );
}

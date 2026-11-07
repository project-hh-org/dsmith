"use client";

import { useId } from "react";
import { Button } from "./ui/button";

export interface FilterCategory {
  value: string;
  label: string;
}

export interface FilterValue {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  onReset?: () => void;
}

export const EMPTY_FILTER: FilterValue = { categories: [], minPrice: "", maxPrice: "" };

const inputClass =
  "w-full rounded-ds-sm border border-ds-gray-100 bg-white px-ds-2 py-ds-2 text-ds-xs text-ds-blue-900 focus:outline-none focus:border-ds-blue-400";

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const uid = useId();

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
      className="flex w-56 flex-col gap-ds-5 rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50 p-ds-4"
    >
      <h2 className="text-ds-xl font-bold text-ds-blue-900">필터</h2>

      <fieldset className="flex flex-col gap-ds-2">
        <legend className="mb-ds-2 text-ds-xs font-medium text-ds-gray-500">카테고리</legend>
        {categories.map((category) => {
          const id = `${uid}-cat-${category.value}`;
          return (
            <label key={category.value} htmlFor={id} className="flex items-center gap-ds-2 text-ds-xs text-ds-blue-900">
              <input
                id={id}
                type="checkbox"
                checked={value.categories.includes(category.value)}
                onChange={() => toggleCategory(category.value)}
              />
              {category.label}
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-ds-2">
        <legend className="mb-ds-2 text-ds-xs font-medium text-ds-gray-500">가격 범위</legend>
        <div className="flex items-center gap-ds-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            aria-invalid={priceInvalid}
            placeholder="최소"
            className={inputClass}
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
          />
          <span className="text-ds-xs text-ds-gray-500">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            aria-invalid={priceInvalid}
            placeholder="최대"
            className={inputClass}
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
          />
        </div>
        {priceInvalid && (
          <p role="alert" className="text-ds-xs text-ds-red-500">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={handleReset}>
        초기화
      </Button>
    </aside>
  );
}

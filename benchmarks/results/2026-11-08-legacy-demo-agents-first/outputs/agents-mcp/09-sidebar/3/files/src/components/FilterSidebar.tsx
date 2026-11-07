"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";

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

const priceInputClass =
  "block w-full rounded-ds-sm border border-ds-gray-100 bg-white p-ds-2 text-ds-xs text-ds-blue-900 focus:border-ds-blue-400 focus:outline-none";

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const uid = useId();
  const minId = `${uid}-min`;
  const maxId = `${uid}-max`;

  const toggleCategory = (category: string) => {
    const categories = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories });
  };

  const minNum = value.minPrice === "" ? null : Number(value.minPrice);
  const maxNum = value.maxPrice === "" ? null : Number(value.maxPrice);
  const rangeInvalid = minNum !== null && maxNum !== null && minNum > maxNum;

  const handleReset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className="flex w-56 flex-col gap-ds-5 rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50 p-ds-4"
    >
      <fieldset className="flex flex-col gap-ds-2">
        <legend className="mb-ds-2 text-ds-xs font-bold text-ds-blue-900">카테고리</legend>
        {categories.map((c) => (
          <label key={c.value} className="flex items-center gap-ds-2 text-ds-xs text-ds-blue-900">
            <input
              type="checkbox"
              checked={value.categories.includes(c.value)}
              onChange={() => toggleCategory(c.value)}
            />
            {c.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-ds-2">
        <legend className="mb-ds-2 text-ds-xs font-bold text-ds-blue-900">가격 범위</legend>
        <div className="flex items-center gap-ds-2">
          <label htmlFor={minId} className="sr-only">
            최소 가격
          </label>
          <input
            id={minId}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="최소"
            value={value.minPrice}
            aria-invalid={rangeInvalid}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className={priceInputClass}
          />
          <span className="text-ds-xs text-ds-gray-500" aria-hidden="true">
            ~
          </span>
          <label htmlFor={maxId} className="sr-only">
            최대 가격
          </label>
          <input
            id={maxId}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="최대"
            value={value.maxPrice}
            aria-invalid={rangeInvalid}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className={priceInputClass}
          />
        </div>
        {rangeInvalid && (
          <p role="alert" className="text-ds-xs text-ds-red-500">
            최소 가격이 최대 가격보다 큽니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={handleReset}>
        초기화
      </Button>
    </aside>
  );
}

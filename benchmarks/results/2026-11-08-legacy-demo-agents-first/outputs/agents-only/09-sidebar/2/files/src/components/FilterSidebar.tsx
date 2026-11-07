"use client";

import { useId } from "react";
import { Button } from "./ui/button";

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
  const uid = useId();
  const minId = `${uid}-min`;
  const maxId = `${uid}-max`;

  const min = value.minPrice === "" ? null : Number(value.minPrice);
  const max = value.maxPrice === "" ? null : Number(value.maxPrice);
  const rangeInvalid = min !== null && max !== null && min > max;

  const toggleCategory = (cat: string) => {
    const next = value.categories.includes(cat)
      ? value.categories.filter((c) => c !== cat)
      : [...value.categories, cat];
    onChange({ ...value, categories: next });
  };

  const reset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  const inputClass =
    "block w-full rounded-ds-sm border border-ds-gray-100 bg-white px-ds-2 py-ds-2 text-ds-xs text-ds-blue-900 focus:border-ds-blue-400 focus:outline-none";

  return (
    <aside
      aria-label="상품 필터"
      className="flex w-56 flex-col gap-ds-5 border-r border-ds-gray-100 bg-ds-gray-50 p-ds-4"
    >
      <h2 className="text-ds-xl font-bold text-ds-blue-900">필터</h2>

      <fieldset className="flex flex-col gap-ds-2">
        <legend className="mb-ds-2 text-ds-xs font-medium text-ds-gray-500">카테고리</legend>
        {categories.map((cat) => (
          <label
            key={cat.value}
            className="flex items-center gap-ds-2 text-ds-xs text-ds-blue-900"
          >
            <input
              type="checkbox"
              checked={value.categories.includes(cat.value)}
              onChange={() => toggleCategory(cat.value)}
              className="h-4 w-4 rounded-ds-sm border-ds-gray-100 accent-[var(--color-blue-400)]"
            />
            {cat.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-ds-3">
        <legend className="mb-ds-2 text-ds-xs font-medium text-ds-gray-500">가격 범위</legend>
        <div className="flex items-center gap-ds-2">
          <div className="flex-1">
            <label htmlFor={minId} className="sr-only">
              최소 가격
            </label>
            <input
              id={minId}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="최소"
              value={value.minPrice}
              onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
              aria-invalid={rangeInvalid}
              className={inputClass}
            />
          </div>
          <span className="text-ds-xs text-ds-gray-500" aria-hidden="true">
            ~
          </span>
          <div className="flex-1">
            <label htmlFor={maxId} className="sr-only">
              최대 가격
            </label>
            <input
              id={maxId}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="최대"
              value={value.maxPrice}
              onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
              aria-invalid={rangeInvalid}
              className={inputClass}
            />
          </div>
        </div>
        {rangeInvalid && (
          <p role="alert" className="text-ds-xs text-ds-red-500">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="md" onClick={reset}>
        초기화
      </Button>
    </aside>
  );
}
